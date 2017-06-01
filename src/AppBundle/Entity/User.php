<?php

namespace AppBundle\Entity;

use Doctrine\ORM\Mapping as ORM;
use FOS\UserBundle\Model\User as BaseUser;
use Doctrine\Common\Collections\ArrayCollection;

/**
 * @ORM\Entity
 * @ORM\Table(name="user")
 */

class User extends BaseUser
{
    /**
     * @ORM\Id
     * @ORM\Column(type="integer")
     * @ORM\GeneratedValue(strategy="AUTO")
     */
    protected $id;

    /**
     * Un utilisateur a crée plusieurs exams
     * @ORM\OneToMany(targetEntity="Exam", mappedBy="creator")
     */
    private $exams;

    /**
     * Many Users are allowed to many exams.
     * @ORM\ManyToMany(targetEntity="Exam", inversedBy="allowedUsers", cascade={"persist", "remove"})
     * @ORM\JoinTable(name="users_exams_allowed")
     */
    private $sharedExams;
    
    public function isAllowedToWatchExam(\AppBundle\Entity\Exam $exam)
    {
        // Si on est admin
        if($this->hasRole('ROLE_ADMIN'))
        {
            return true;
        }
        if(empty($this->getSharedExams()))
        {
            return false;
        }
        // Si on a crée l'exam
        foreach($this->getExams() as $current)
        {
            if($current == $exam)
            {
                return true;
            }
        }
        // Si on nous a partagé l'exam
        foreach($this->getSharedExams() as $current)
        {
            if($current == $exam)
            {
                return true;
            }
        }
        return false;
    }

    public function __construct()
    {
        parent::__construct();

        $this->exams = new ArrayCollection();
        $this->sharedExams = new ArrayCollection();
    }

    /**
     * Add exam
     *
     * @param \AppBundle\Entity\Exam $exam
     *
     * @return User
     */
    public function addExam(\AppBundle\Entity\Exam $exam)
    {
        $this->exams[] = $exam;

        return $this;
    }

    /**
     * Remove exam
     *
     * @param \AppBundle\Entity\Exam $exam
     */
    public function removeExam(\AppBundle\Entity\Exam $exam)
    {
        $this->exams->removeElement($exam);
    }

    /**
     * Get exams
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getExams()
    {
        return $this->exams;
    }

    /**
     * Add sharedExam
     *
     * @param \AppBundle\Entity\Exam $sharedExam
     *
     * @return User
     */
    public function addSharedExam(\AppBundle\Entity\Exam $sharedExam)
    {
        $this->sharedExams[] = $sharedExam;

        return $this;
    }

    /**
     * Remove sharedExam
     *
     * @param \AppBundle\Entity\Exam $sharedExam
     */
    public function removeSharedExam(\AppBundle\Entity\Exam $sharedExam)
    {
        $this->sharedExams->removeElement($sharedExam);
    }

    /**
     * Get sharedExams
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getSharedExams()
    {
        return $this->sharedExams;
    }
}
