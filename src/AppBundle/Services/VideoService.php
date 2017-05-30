<?php

namespace AppBundle\Services;

use AppBundle\Exception\SQLiteFileNotFoundException;
use Monolog\Logger;
use Symfony\Component\Finder\Finder;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Filesystem\Exception\IOExceptionInterface;

class VideoService
{

    const VIDEO_FORMAT = 'mp4';

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
            $files[] =  array(
                'path' => 'bundles/app/uploads/' . $file->getRelativePathname(),
                'username' => $this->getUsernameFromPath($file->getRelativePathname()),
                'eventCount' => count($repository->findBy(
                    array(
                        'username' => $this->getUsernameFromPath($file->getRelativePathname())
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
        foreach ($finder as $folder) {
            $folders[] =  array(
                'path' => 'bundles/app/uploads/' . $folder->getRelativePathname(),
                'name' => $folder->getRelativePathname(),
                'studentCount' => $this->getStudentCount($folder->getRelativePathname())
            );
        }
        return $folders;
    }

    public function getLoggedUsers($examName)
    {
        try {
            $this->switchDatabase($this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/'. $examName . '/database.sqlite');
        } catch (\Exception $e) {
            throw new SQLiteFileNotFoundException($e->getMessage(), $e->getCode(), $e, '$this->container->getParameter(\'kernel.root_dir\') . \'/../web/bundles/app/uploads/\'. $examName . \'/database.sqlite\'');
        }
    }

    public function createExam($examName)
    {
        $command = 'node nodejs_server/app -s ' . $examName;
        $process = new Process($command . ' > /dev/null 2>&1 &');
        $process->setPty(true);
        $process->start();
    }

    public function stopExam($examName)
    {
        $command = 'node nodejs_server/app -s ' . $examName;
        $process = new Process("ps -ax | grep '" . $command . "' | head -n 1 | awk '{print $1;}'");
        $process->setPty(true);
        $process->run();
        return $this->executeCommand('kill ' . $process->getOutput());
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
            echo "An error occurred while creating your directory at ".$e->getPath();
        }
    }
}