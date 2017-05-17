<?php

namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\DateType;

class ExamType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name', TextType::class, array('label' => "Nom de l'examen"))
            ->add('username', TextType::class, array('label' => "Nom d'utilisateur"))
            ->add('password', TextType::class, array('label' => "Mot de passe"))
            ->add('save', SubmitType::class, array('label' => "Créer l'examen", 'attr' => array('class' => 'btn btn-default')))
        ;
    }
}