<?php

namespace AppBundle\Controller;

use AppBundle\Entity\Student;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use AppBundle\Exception\SQLiteFileNotFoundException;
use AppBundle\Entity\Exam;
use AppBundle\Form\ExamType;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\Filesystem\Exception\IOExceptionInterface;
use Symfony\Component\HttpFoundation\JsonResponse;

class StaticController extends Controller
{
    public function homepageAction()
    {
        $videoService = $this->container->get('app.video_service');
        $exams = $videoService->listExams();
        $pendingExams = $this->getDoctrine()
            ->getRepository('AppBundle:Exam')
            ->findAll();
        return $this->render('AppBundle:Static:homepage.html.twig', array(
            'exams' => $exams,
            'pendingExams' => $pendingExams
        ));
    }

    public function displayExamAction($examName)
    {

        $videoService = $this->container->get('app.video_service');

        try{
            $data = $videoService->listFiles($examName);
        }
        catch (SQLiteFileNotFoundException $e) {
            return $this->render('AppBundle:Static:error_database_file_not_found.html.twig', array(
                'path' => $e->getPath()
            ));
        }
        return $this->render('AppBundle:Static:display_exam.html.twig', array(
            'examName' => $examName,
            'files' => $data
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

        $student = $this->getDoctrine()->getRepository('AppBundle:Student')->findOneBy(
            array(
                'username' => $etudiant
            )
        );
        $events = $repository->findBy(
            array(
                'student' => $student
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

        /** @var \AppBundle\Entity\Exam $exam */
        $exam = new Exam();
        $form = $this->createForm(ExamType::class, $exam);

        $errors = array();
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $exam = $form->getData();
            $exam->setDate(new \DateTime());

            // Test de l'utilisation du port
            /** @var \AppBundle\Entity\Exam $exam */
            $usedPort = $this->getDoctrine()
                ->getRepository('AppBundle:Exam')
                ->findOneByPort($exam->getPort());

            if($usedPort)
            {
                $errors[] = "Le port " . $exam->getPort() . " est déjà utilisé par l'examen " . $usedPort->getName();
            }

            // Test de l'existence du dossier
            $fs = new Filesystem();
            $folderName = $this->container->getParameter('kernel.root_dir') . '/../web/bundles/app/uploads/' . $exam->getName() . "/";
            if($fs->exists($folderName))
            {
                $errors[] = "Le dossier " . $exam->getName() . " existe déjà, veuillez choisir un autre nom ou supprimez l'examen portant ce nom";
            }

            if(empty($errors))
            {
                try {
                    $fs->mkdir($folderName);
                } catch (IOExceptionInterface $e) {
                    $error = "Erreur : " . $e->getMessage();
                }

                /** @var \AppBundle\Services\VideoService $videoService */
                $videoService = $this->get('app.video_service');
                $videoService->startExam($exam);

                $em = $this->getDoctrine()->getManager();
                $em->persist($exam);
                $em->flush();

                return $this->redirectToRoute('app_pending_exam', array('id' => $exam->getId()));
            }
        }


        return $this->render('AppBundle:Static:create_exam.html.twig', array(
            'form' => $form->createView(),
            'errors' => $errors
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

    public function stopExamAction(Request $request, $examName)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('httpCode' => 400, 'error' => 'Requête non AJAX'));
        } else {
            $response = new JsonResponse();

            /** @var \AppBundle\Entity\Exam $exam */
            $exam = $this->getDoctrine()
                ->getRepository('AppBundle:Exam')
                ->findOneByName($examName);

            if (!$exam) {
                $response->setData(array(
                    'error' => "Pas d'examen trouvé pour le nom: " . $examName
                ));
                return $response;
            }
            /** @var \AppBundle\Services\VideoService $videoService */
            $videoService = $this->get('app.video_service');
            $videoService->stopExam($exam);
            $em = $this->getDoctrine()->getManager();
            $em->remove($exam);
            $em->flush();
            return $response;
        }
    }
    
    public function getLoggedStudentsAction(Request $request, $examName)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('httpCode' => 400, 'error' => 'Requête non AJAX'));
        } else {
            $response = new JsonResponse();

            $serializer = $this->container->get('fos_js_routing.serializer');

            /** @var \AppBundle\Services\VideoService $videoService */
            $videoService = $this->get('app.video_service');
            $students = $videoService->getLoggedStudents($examName);
            $students = array();
            //for($i = 0; $i < 30; $i++)
            if (rand(0, 1))
            {
                $student = new Student();
                $student->setConnected(true);
                $student->setUsername("kguiougou");
                $students[] = $serializer->serialize($student, 'json');
                $student2 = new Student();
                $student2->setConnected(true);
                $student2->setUsername("echavallier");
                $students[] = $serializer->serialize($student2, 'json');
            }
            else
            {
                $student = new Student();
                $student->setConnected(false);
                $student->setUsername("kguiougou");
                $students[] = $serializer->serialize($student, 'json');
                $student2 = new Student();
                $student2->setConnected(false);
                $student2->setUsername("echavallier");
                $students[] = $serializer->serialize($student2, 'json');
            }
            $response->setData(array(
                'students' => $students
            ));
            return $response;
        }
    }

    public function deleteExamAction(Request $request, $examName)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('httpCode' => 400, 'error' => 'Requête non AJAX'));
        } else {
            $response = new JsonResponse();
            /** @var \AppBundle\Services\VideoService $videoService */
            $videoService = $this->get('app.video_service');
            try {
                $videoService->deleteExam($examName);
            } catch (\Exception $e) {
                $response->setData(array(
                    'error' => $e->getMessage()
                ));
            }
            $response->setData(array(
                'error' => 'toto'
            ));
            return $response;
        }
    }
}