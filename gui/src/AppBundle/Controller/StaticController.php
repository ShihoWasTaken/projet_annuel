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
        $exams = $videoService->listExams();
        return $this->render('AppBundle:Static:homepage.html.twig', array(
            'exams' => $exams
        ));
    }

    public function displayExamAction($examName)
    {

        $videoService = $this->container->get('app.video_service');

        $files = $videoService->listFiles($examName);
        return $this->render('AppBundle:Static:display_exam.html.twig', array(
            'examName' => $examName,
            'files' => $files
        ));
    }

    public function displayVideoAction($examName, $etudiant)
    {

        $videoService = $this->container->get('app.video_service');
        try {
            $videoService->switchDatabase($this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/'. $examName . '/database.sqlite');
        } catch (\Exception $e) {
            return $this->render('AppBundle:Static:error_database_file_not_found.html.twig', array(
                'path' => $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/'. $examName . '/database.sqlite'
            ));
        }

        $repository = $this->getDoctrine()->getRepository('AppBundle:SuspiciousEvent');

        $events = $repository->findBy(
            array(
                'username' => $etudiant
            )
        );
        return $this->render('AppBundle:Static:display_video.html.twig', array(
            'examName' => $examName,
            'etudiant' => $etudiant,
            'events' => $events
        ));
    }

}