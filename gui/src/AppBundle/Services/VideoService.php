<?php

namespace AppBundle\Services;

use AppBundle\Exception\SQLiteFileNotFoundException;
use Monolog\Logger;
use Symfony\Component\Finder\Finder;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

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
        // TODO: changer la commande
        $path = $this->container->getParameter('kernel.root_dir') . '/../../serveur/';
        $process = new Process('cd ' . $path . ' && node app.js -s ' . $examName);
        $process->setPty(true);
        $process->run();

        // executes after the command finishes
        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
        return $process->getPid();
    }

    public function stopExam($pid)
    {
        return $this->executeCommand('kill -SIGTERM ' . $pid);
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
}