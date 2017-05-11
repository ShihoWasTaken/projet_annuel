<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="suspicious_event")
 */
class SuspiciousEvent
{
    /**
     * @ORM\Id
     * @ORM\Column(type="int")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=8)
     */
    private $computerName;

    /**
     * @ORM\Column(type="string", length=24)
     */
    private $examName;

    /**
     * @ORM\Column(type="int")
     */
    private $date;

    /**
     * @ORM\Column(type="string", length=1024)
     */
    private $description;

    public function __construct($computerName, $examName, $date, $description)
    {
        $this->computerName = $computerName;
        $this->examName = $examName;
        $this->date = $date;
        $this->description = $description;
    }


    /**
     * Get id
     *
     * @return \int
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set computerName
     *
     * @param string $computerName
     *
     * @return SuspiciousEvent
     */
    public function setComputerName($computerName)
    {
        $this->computerName = $computerName;

        return $this;
    }

    /**
     * Get computerName
     *
     * @return string
     */
    public function getComputerName()
    {
        return $this->computerName;
    }

    /**
     * Set examName
     *
     * @param string $examName
     *
     * @return SuspiciousEvent
     */
    public function setExamName($examName)
    {
        $this->examName = $examName;

        return $this;
    }

    /**
     * Get examName
     *
     * @return string
     */
    public function getExamName()
    {
        return $this->examName;
    }

    /**
     * Set date
     *
     * @param \DateTime $date
     *
     * @return SuspiciousEvent
     */
    public function setDate($date)
    {
        $this->date = $date;

        return $this;
    }

    /**
     * Get date
     *
     * @return \DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * Set description
     *
     * @param string $description
     *
     * @return SuspiciousEvent
     */
    public function setDescription($description)
    {
        $this->description = $description;

        return $this;
    }

    /**
     * Get description
     *
     * @return string
     */
    public function getDescription()
    {
        return $this->description;
    }
}
