<?php

    namespace AppBundle\Exception;

    class SQLiteFileNotFoundException extends \Exception
    {
        private $path;

        public function __construct($message, $code, \Exception $previous, $path)
        {
            parent::__construct($message, $code, $previous);
            $this->path = $path;
        }

        public function getPath()
        {
            return $this->path;
        }
    }