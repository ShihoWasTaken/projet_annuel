<?php

namespace AppBundle\Entity;


use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;

/**
 * @ORM\Entity
 * @ORM\Table(name="students")
 */
class Student
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    private $id;

    /**
     * @ORM\Column(name="username", type="text")
     */
    private $username;

    /**
     * @ORM\Column(type="integer")
     */
    private $port;

    /**
     * @ORM\Column(type="boolean")
     */
    private $connected;

    /**
     * @ORM\Column(name="disconnect_on", type="integer")
     */
    private $disconnectedAt;

    /**
     * One Student has Many Events.
     * @ORM\OneToMany(targetEntity="SuspiciousEvent", mappedBy="student")
     */
    private $events;

    public function __construct() {
        $this->events = new ArrayCollection();
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
     * Set username
     *
     * @param string $username
     *
     * @return Student
     */
    public function setUsername($username)
    {
        $this->username = $username;

        return $this;
    }

    /**
     * Get username
     *
     * @return string
     */
    public function getUsername()
    {
        return $this->username;
    }

    /**
     * Set port
     *
     * @param integer $port
     *
     * @return Student
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
     * Set connected
     *
     * @param boolean $connected
     *
     * @return Student
     */
    public function setConnected($connected)
    {
        $this->connected = $connected;

        return $this;
    }

    /**
     * Get connected
     *
     * @return boolean
     */
    public function getConnected()
    {
        return $this->connected;
    }

    /**
     * Set disconnectedAt
     *
     * @param integer $disconnectedAt
     *
     * @return Student
     */
    public function setDisconnectedAt($disconnectedAt)
    {
        $this->disconnectedAt = $disconnectedAt;

        return $this;
    }

    /**
     * Get disconnectedAt
     *
     * @return integer
     */
    public function getDisconnectedAt()
    {
        return $this->disconnectedAt;
    }

    /**
     * Add event
     *
     * @param \AppBundle\Entity\SuspiciousEvent $event
     *
     * @return Student
     */
    public function addEvent(\AppBundle\Entity\SuspiciousEvent $event)
    {
        $this->events[] = $event;

        return $this;
    }

    /**
     * Remove event
     *
     * @param \AppBundle\Entity\SuspiciousEvent $event
     */
    public function removeEvent(\AppBundle\Entity\SuspiciousEvent $event)
    {
        $this->events->removeElement($event);
    }

    /**
     * Get events
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getEvents()
    {
        return $this->events;
    }
}
