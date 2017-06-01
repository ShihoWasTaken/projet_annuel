<?php

namespace AppBundle\Services;

use AppBundle\Exception\SQLiteFileNotFoundException;
use Monolog\Logger;
use Symfony\Component\Config\Definition\Exception\Exception;
use Symfony\Component\Finder\Finder;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Filesystem\Exception\IOExceptionInterface;

class VideoService
{

    const VIDEO_FORMAT = 'webm';

    /**
     * @var \Monolog\Logger
     */
    private $logger;

    /**
     * @var \Symfony\Component\DependencyInjection\ContainerInterface;
     */
    private $container;

    public function __construct(Logger $logger, ContainerInterface $container)
    {
        $this->logger = $logger;
        $this->container = $container;
    }

    public function switchDatabase($path)
    {
        $connection = $this->container->get(sprintf('doctrine.dbal.%s_connection', 'default'));
        $connection->close();

        $refConn = new \ReflectionObject($connection);
        $refParams = $refConn->getProperty('_params');
        $refParams->setAccessible('public'); //we have to change it for a moment

        $params = $refParams->getValue($connection);
        $params['path'] = $path;

        $refParams->setAccessible('private');
        $refParams->setValue($connection, $params);
        $this->container->get('doctrine')->resetEntityManager('default'); // for sure (unless you like broken transactions)

        $this->container->get('doctrine')->getManager()->getConnection()->connect();
    }

    private function getUsernameFromPath($path)
    {
        $pos = strrpos($path, "/");
        $sub = substr($path, $pos);
        $pos = strrpos($sub, ".");
        $sub = substr($sub, 0, $pos);
        return $sub;
    }

    private function getStudentCount($examName)
    {
        $directoryPath = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/' . $examName;
        $finder = new Finder();
        $finder->files()->in($directoryPath)->name('*.' . self::VIDEO_FORMAT)->sortByName();
        return count($finder);
    }

    public function listFiles($examName)
    {
        try {
            $this->switchDatabase($this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/'. $examName . '/database.sqlite');
        } catch (\Exception $e) {
            throw new SQLiteFileNotFoundException($e->getMessage(), $e->getCode(), $e, '$this->container->getParameter(\'kernel.root_dir\') . \'/../web/bundles/app/uploads/\'. $examName . \'/database.sqlite\'');
        }

        $repository = $this->container->get('doctrine')->getRepository('AppBundle:SuspiciousEvent');

        $directoryPath = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/' . $examName;
        $finder = new Finder();
        $finder->files()->in($directoryPath)->depth('== 0')->name('*.' . self::VIDEO_FORMAT)->sortByName();
        $files = array();
        foreach ($finder as $file) {
            $student = $this->container->get('doctrine')->getRepository('AppBundle:Student')->findOneBy(
                array(
                    'username' => $this->getUsernameFromPath($file->getRelativePathname())
                )
            );
            $files[] =  array(
                'path' => 'bundles/app/uploads/' . $file->getRelativePathname(),
                'username' => $this->getUsernameFromPath($file->getRelativePathname()),
                'eventCount' => count($repository->findBy(
                    array(
                        'student' => $student
                    )
                ))
            );
        }
        return $files;
    }

    public function listExams()
    {
        $directoryPath = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads';
        $finder = new Finder();
        $finder->directories()->in($directoryPath)->depth('== 0')->sortByName();
        $folders = array();

        /** @var \AppBundle\Entity\User $user */
        $user = $this->container->get('security.token_storage')->getToken()->getUser();
        foreach ($finder as $folder) {

            /** @var \AppBundle\Entity\Exam $exam */
            $exam = $this->container->get('doctrine')->getRepository('AppBundle:Exam')->findOneBy(
                array(
                    'name' => $folder->getRelativePathname()
                )
            );
            if($user->isAllowedToWatchExam($exam))
            {
                $folders[] =  array(
                    'creator' => $exam->getCreator(),
                    'date' => $exam->getDate(),
                    'path' => 'bundles/app/uploads/' . $folder->getRelativePathname(),
                    'name' => $folder->getRelativePathname(),
                    'studentCount' => $this->getStudentCount($folder->getRelativePathname())
                );
            }
        }
        return $folders;
    }

    public function getLoggedStudents($examName)
    {
        try {
            $this->switchDatabase($this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/'. $examName . '/database.sqlite');
        } catch (\Exception $e) {
            throw new SQLiteFileNotFoundException($e->getMessage(), $e->getCode(), $e, '$this->container->getParameter(\'kernel.root_dir\') . \'/../web/bundles/app/uploads/\'. $examName . \'/database.sqlite\'');
        }
        /** @var \AppBundle\Entity\Student $students */
        $students = $this->container->get('doctrine')
            ->getRepository('AppBundle:Student')
            ->findAll();

        return $students;
    }

    public function startExam(\AppBundle\Entity\Exam $exam)
    {
        $command = $this->getServerCommand($exam);
        $this->logger->addDebug('Commande node lancée : ' . $command);
        //$process = new Process($command . ' > /dev/null 2>&1 &');
        $process = new Process($command . ' > bundles/app/uploads/' . $exam->getName() . '/server.log &');
        $process->setPty(true);
        $process->start();
    }

    public function stopExam(\AppBundle\Entity\Exam $exam)
    {
        $command = $this->getServerCommand($exam);
        $process = new Process("ps -ax | grep '" . $command . "' | head -n 1 | awk '{print $1;}'");
        $process->setPty(true);
        $process->run();
        return $this->executeCommand('kill ' . $process->getOutput());
    }

    private function getServerCommand(\AppBundle\Entity\Exam $exam)
    {
        return 'node nodejs_server/app -s ' . $exam->getName() . ' -p ' . $exam->getPort() . ' -i ' . $exam->getFramesPerSecond() . ' -r \'' . $exam->getWidth() . 'x'. $exam->getHeight() . '\'';
    }

    private function executeCommand($command)
    {
        $process = new Process($command);
        $process->setPty(true);
        $process->run();

        // executes after the command finishes
        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
        return $process->getOutput();
    }

    public function deleteExam($examName)
    {
        $fs = new Filesystem();
        $folderName = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/' . $examName . "/";
        try {
            $fs->remove($folderName);
        } catch (IOExceptionInterface $e) {
            throw new Exception("Impossible de supprimer le dossier" . $folderName);
        }
    }
}