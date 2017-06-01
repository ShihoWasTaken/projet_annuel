<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="events")
 */
class SuspiciousEvent
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * Many Events have One Student.
     *
     * @ORM\ManyToOne(targetEntity="Student", inversedBy="events")
     * @ORM\JoinColumn(name="student", referencedColumnName="id")
     */
    private $student;

    /**
     * @ORM\Column(name="file", type="text")
     */
    private $filename;

    /**
     * @ORM\Column(name="action", type="text")
     */
    private $action;

    /**
     * @ORM\Column(name="size", type="text")
     */
    private $size;

    /**
     * @ORM\Column(name="time", type="integer")
     */
    private $moment;


    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set filename
     *
     * @param string $filename
     *
     * @return SuspiciousEvent
     */
    public function setFilename($filename)
    {
        $this->filename = $filename;

        return $this;
    }

    /**
     * Get filename
     *
     * @return string
     */
    public function getFilename()
    {
        return $this->filename;
    }

    /**
     * Set action
     *
     * @param string $action
     *
     * @return SuspiciousEvent
     */
    public function setAction($action)
    {
        $this->action = $action;

        return $this;
    }

    /**
     * Get action
     *
     * @return string
     */
    public function getAction()
    {
        return $this->action;
    }

    /**
     * Set size
     *
     * @param string $size
     *
     * @return SuspiciousEvent
     */
    public function setSize($size)
    {
        $this->size = $size;

        return $this;
    }

    /**
     * Get size
     *
     * @return string
     */
    public function getSize()
    {
        return $this->size;
    }

    /**
     * Set moment
     *
     * @param integer $moment
     *
     * @return SuspiciousEvent
     */
    public function setMoment($moment)
    {
        $this->moment = $moment;

        return $this;
    }

    /**
     * Get moment
     *
     * @return integer
     */
    public function getMoment()
    {
        return $this->moment;
    }

    /**
     * Set student
     *
     * @param \AppBundle\Entity\Student $student
     *
     * @return SuspiciousEvent
     */
    public function setStudent(\AppBundle\Entity\Student $student = null)
    {
        $this->student = $student;

        return $this;
    }

    /**
     * Get student
     *
     * @return \AppBundle\Entity\Student
     */
    public function getStudent()
    {
        return $this->student;
    }
}
