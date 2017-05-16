<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;

/**
 * @ORM\Entity
 * @ORM\Table(name="evenement")
 */
class SuspiciousEvent
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     */
    private $id;

    /**
     * @ORM\Column(type="string", length=24)
     */
    private $username;

    /**
     * @ORM\Column(type="integer")
     */
    private $moment;

    /**
     * @ORM\Column(type="string", length=1024)
     */
    private $description;

    /**
     * Set id
     *
     * @param integer $id
     *
     * @return SuspiciousEvent
     */
    public function setId($id)
    {
        $this->id = $id;

        return $this;
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
     * @return SuspiciousEvent
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
