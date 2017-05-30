<?php

namespace AppBundle\Twig;

class AppExtension extends \Twig_Extension
{
    public function getFilters()
    {
        return array(
            new \Twig_SimpleFilter('filesize', array($this, 'getFileSize')),
            new \Twig_SimpleFilter('tildePath', array($this, 'getTildePath')),
            new \Twig_SimpleFilter('videoTime', array($this, 'getTime')),
        );
    }

    public function getFileSize($size)
    {
        if($size < 1000)
        {
            return $size . ' octet(s)';
        }
        else
        {
            return round($size/1000) . ' Ko';
        }
    }

    public function getTildePath($path)
    {
        for($i = 0; $i < 3; $i++)
        {
            $pos = strpos($path, "/");
            $path = substr($path, $pos+1);
        }
        return "~/" . $path;
    }

    public function getTime($time)
    {
        $time = $time / 1000;
        $hours = floor($time / 3600);
        $minutes = floor($time / 60);
        $seconds = $time % 60;
        return sprintf('%02d', $hours) . ':' . sprintf('%02d', $minutes) .':' . sprintf('%02d', $seconds);
    }

    public function getName()
    {
        return 'app_extension';
    }
}