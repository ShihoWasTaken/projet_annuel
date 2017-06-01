<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;

/**
 * @ORM\Entity
 * @ORM\Table(name="exam")
 */
class Exam
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;
    
    /**
     * @ORM\Column(type="string", length=32)
     */
    private $name;

    /**
     * @ORM\Column(type="datetime")
     */
    private $date;

    /**
     * Many Exams have One User who created them.
     *
     * @ORM\ManyToOne(targetEntity="User", inversedBy="exams")
     * @ORM\JoinColumn(name="creator_id", referencedColumnName="id")
     */
    private $creator;


    /**
     * @ORM\Column(type="smallint")
     */
    private $width;

    /**
     * @ORM\Column(type="smallint")
     */
    private $height;

    /**
     * @ORM\Column(type="smallint")
     */
    private $framesPerSecond;

    /**
     * @ORM\Column(type="smallint")
     */
    private $port;

    /**
     * @ORM\Column(type="boolean")
     */
    private $finished = false;

    // ...
    /**
     * Many exams have many user
     * @ORM\ManyToMany(targetEntity="User", mappedBy="sharedExams", cascade={"persist", "remove"})
     */
    private $allowedUsers;


    public function __construct()
    {
        $this->allowedUsers = new ArrayCollection();
    }

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
     * Set name
     *
     * @param string $name
     *
     * @return Exam
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set date
     *
     * @param \DateTime $date
     *
     * @return Exam
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
     * Set width
     *
     * @param integer $width
     *
     * @return Exam
     */
    public function setWidth($width)
    {
        $this->width = $width;

        return $this;
    }

    /**
     * Get width
     *
     * @return integer
     */
    public function getWidth()
    {
        return $this->width;
    }

    /**
     * Set height
     *
     * @param integer $height
     *
     * @return Exam
     */
    public function setHeight($height)
    {
        $this->height = $height;

        return $this;
    }

    /**
     * Get height
     *
     * @return integer
     */
    public function getHeight()
    {
        return $this->height;
    }

    /**
     * Set framesPerSecond
     *
     * @param integer $framesPerSecond
     *
     * @return Exam
     */
    public function setFramesPerSecond($framesPerSecond)
    {
        $this->framesPerSecond = $framesPerSecond;

        return $this;
    }

    /**
     * Get framesPerSecond
     *
     * @return integer
     */
    public function getFramesPerSecond()
    {
        return $this->framesPerSecond;
    }

    /**
     * Set port
     *
     * @param integer $port
     *
     * @return Exam
     */
    public function setPort($port)
    {
        $this->port = $port;

        return $this;
    }

    /**
     * Get port
     *
     * @return integer
     */
    public function getPort()
    {
        return $this->port;
    }

    /**
     * Set creator
     *
     * @param \AppBundle\Entity\User $creator
     *
     * @return Exam
     */
    public function setCreator(\AppBundle\Entity\User $creator = null)
    {
        $this->creator = $creator;

        return $this;
    }

    /**
     * Get creator
     *
     * @return \AppBundle\Entity\User
     */
    public function getCreator()
    {
        return $this->creator;
    }

    /**
     * Add allowedUser
     *
     * @param \AppBundle\Entity\User $allowedUser
     *
     * @return Exam
     */
    public function addAllowedUser(\AppBundle\Entity\User $allowedUser)
    {
        $this->allowedUsers[] = $allowedUser;

        return $this;
    }

    /**
     * Remove allowedUser
     *
     * @param \AppBundle\Entity\User $allowedUser
     */
    public function removeAllowedUser(\AppBundle\Entity\User $allowedUser)
    {
        $this->allowedUsers->removeElement($allowedUser);
    }

    /**
     * Get allowedUsers
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getAllowedUsers()
    {
        return $this->allowedUsers;
    }

    /**
     * Set finished
     *
     * @param boolean $finished
     *
     * @return Exam
     */
    public function setFinished($finished)
    {
        $this->finished = $finished;

        return $this;
    }

    /**
     * Is finished
     *
     * @return boolean
     */
    public function isFinished()
    {
        return $this->finished;
    }
}
