<?php

namespace AppBundle\Controller;

use AppBundle\Entity\SuspiciousEvent;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Constraints\Length;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\Extension\Core\Type\EmailType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\Extension\Core\Type\SubmitType;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;

class StaticController extends Controller
{
    public function homepageAction()
    {
        $videoService = $this->container->get('app.video_service');
        $events = array();
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");

        $files = $videoService->listFiles();
        return $this->render('AppBundle:Static:homepage.html.twig', array(
            'events' => $events,
            'files' => $files
        ));
    }

    public function displayAction()
    {
        $videoService = $this->container->get('app.video_service');
        $events = array();
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 2, "toto");
        $events[] = new SuspiciousEvent("HP7", "CUDA", 4, "toto 2");

        $files = $videoService->listFiles();
        return $this->render('AppBundle:Static:display.html.twig', array(
            'events' => $events,
            'files' => $files
        ));
    }
}