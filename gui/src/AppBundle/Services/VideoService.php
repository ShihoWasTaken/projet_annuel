<?php

namespace AppBundle\Services;

use Monolog\Logger;
use Symfony\Component\Finder\Finder;
use Symfony\Component\DependencyInjection\ContainerInterface;


class VideoService
{
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

    public function listFiles()
    {
        $directoryPath = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads';
        $finder = new Finder();
        $finder->files()->in($directoryPath);
        $files = array();
        foreach ($finder as $file) {/*
            // Dump the absolute path
            var_dump($file->getRealPath());

            // Dump the relative path to the file, omitting the filename
            var_dump($file->getRelativePath());

            // Dump the relative path to the file
            var_dump($file->getRelativePathname());*/
            $files[] =  'bundles/app/uploads/' . $file->getRelativePathname();
        }
        return $files;
    }

}