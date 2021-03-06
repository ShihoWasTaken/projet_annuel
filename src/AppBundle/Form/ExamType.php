<?php

namespace AppBundle\Form;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;

class ExamType extends AbstractType
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('name', TextType::class, array('label' => "Nom de l'examen"))
            ->add('width', IntegerType::class, array('label' => "Largeur"))
            ->add('height', IntegerType::class, array('label' => "Hauteur"))
            ->add('framesPerSecond', IntegerType::class, array('label' => "FPS"))
            ->add('port', IntegerType::class, array('label' => "Port"))
            ->add('save', SubmitType::class, array('label' => "Créer l'examen", 'attr' => array('class' => 'btn btn-default')))
        ;
    }
}