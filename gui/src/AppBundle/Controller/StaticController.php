<?php

namespace AppBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use AppBundle\Exception\SQLiteFileNotFoundException;
use AppBundle\Entity\Exam;
use AppBundle\Form\ExamType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Filesystem\Exception\IOExceptionInterface;

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

        try{
            $files = $videoService->listFiles($examName);
        }
        catch (SQLiteFileNotFoundException $e) {
            return $this->render('AppBundle:Static:error_database_file_not_found.html.twig', array(
                'path' => $e->getPath()
            ));
        }
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

    public function newExamAction(Request $request)
    {
        $exam = new Exam();
        $form = $this->createForm(ExamType::class, $exam);

        $error = null;
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $exam = $form->getData();
            $exam->setDate(new \DateTime());

            $fs = new Filesystem();
            $folderName = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/' . $exam->getName() . "/";
            //$folderName = $exam->getName() . "/" ;
            if($fs->exists($folderName))
            {
                $error = "Le dossier " . $exam->getName() . " existe déjà, veuillez choisir un autre nom ou supprimez l'examen portant ce nom";
            }
            else
            {
                try {
                    $fs->mkdir($folderName);
                } catch (IOExceptionInterface $e) {
                    $error = "Erreur : " . $e->getMessage();
                }
            }

            if(empty($error))
            {
                $em = $this->getDoctrine()->getManager();
                $em->persist($exam);
                $em->flush();

                return $this->redirectToRoute('app_pending_exam', array('id' => $exam->getId()));
            }
        }


        return $this->render('AppBundle:Static:create_exam.html.twig', array(
            'form' => $form->createView(),
            'error' => $error
        ));
    }

    public function pendingExamListAction()
    {
        $exams = $this->getDoctrine()
            ->getRepository('AppBundle:Exam')
            ->findAll();

        return $this->render('AppBundle:Static:pending_exam_list.html.twig', array(
            'exams' => $exams
        ));
    }

    public function pendingExamAction($id)
    {
        $exam = $this->getDoctrine()
            ->getRepository('AppBundle:Exam')
            ->find($id);

        if (!$exam) {
            throw $this->createNotFoundException(
                "Pas d'examen trouvé pour l'id" . $id
            );
        }
        return $this->render('AppBundle:Static:pending_exam.html.twig', array(
            'exam' => $exam
        ));
    }

}