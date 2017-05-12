<?php

namespace AppBundle\Services;

use Monolog\Logger;
use Symfony\Component\Finder\Finder;
use Symfony\Component\DependencyInjection\ContainerInterface;


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

    public function getUsernameFromPath($path)
    {
        $pos = strrpos($path, "/");
        $sub = substr($path, $pos + 1);
        $pos = strrpos($sub, ".");
        $sub = substr($sub, 0, $pos);
        return $sub;
    }

    public function listFiles()
    {
        $directoryPath = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads';
        $finder = new Finder();
        $finder->files()->in($directoryPath)->name('*.' . self::VIDEO_FORMAT)->sortByName();
        $files = array();
        foreach ($finder as $file) {/*
            // Dump the absolute path
            var_dump($file->getRealPath());

            // Dump the relative path to the file, omitting the filename
            var_dump($file->getRelativePath());

            // Dump the relative path to the file
            var_dump($file->getRelativePathname());*/
            $files[] =  array(
                'path' => 'bundles/app/uploads/' . $file->getRelativePathname(),
                'username' => $this->getUsernameFromPath($file->getRelativePathname())
            );
        }
        return $files;
    }

    public function listExams()
    {
        $directoryPath = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads';
        $finder = new Finder();
        $finder->directories()->in($directoryPath)->sortByName();
        $folders = array();
        foreach ($finder as $folder) {
            $folders[] =  array(
                'path' => 'bundles/app/uploads/' . $folder->getRelativePathname(),
                'name' => $folder->getRelativePathname()
            );
        }
        return $folders;
    }

}