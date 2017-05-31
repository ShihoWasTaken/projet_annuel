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
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;

class StaticController extends Controller
{
    public function homepageAction()
    {
        $videoService = $this->container->get('app.video_service');
        $exams = $videoService->listExams();
        $pendingExams = $this->getDoctrine()
            ->getRepository('AppBundle:Exam')
            ->findBy(
                array(
                    "finished" => false,
                )
            );
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
            $exam->setCreator($this->get('security.token_storage')->getToken()->getUser());

            // Test de l'utilisation du port
            /** @var \AppBundle\Entity\Exam $usedPort */
            $usedPort = $this->getDoctrine()
                ->getRepository('AppBundle:Exam')
                ->findOneByPort($exam->getPort());

            if($usedPort)
            {
                if(!$usedPort->isFinished())
                {
                    $errors[] = "Le port " . $exam->getPort() . " est déjà utilisé par l'examen " . $usedPort->getName();
                }
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

                if(empty($errors))
                {
                    /** @var \AppBundle\Services\VideoService $videoService */
                    $videoService = $this->get('app.video_service');
                    $videoService->startExam($exam);

                    $em = $this->getDoctrine()->getManager();
                    $em->persist($exam);
                    $em->flush();

                    return $this->redirectToRoute('app_pending_exam', array('id' => $exam->getId()));
                }

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
            try {
                $videoService->stopExam($exam);
                $em = $this->getDoctrine()->getManager();
                $exam->setFinished(true);
                $em->merge($exam);
                $em->flush();
            } catch (\Exception $e) {
                $response->setData(array(
                    'error' => "Erreur : " . $e->getMessage()
                ));
            }
            return $response;
        }
    }

    public function getLoggedStudentsAction(Request $request, $examName)
    {
        if (!$request->isXmlHttpRequest()) {
            return new JsonResponse(array('httpCode' => 400, 'error' => 'Requête non AJAX'));
        } else {
            $response = new JsonResponse();



            $encoder = new JsonEncoder();
$normalizer = new ObjectNormalizer();

$normalizer->setCircularReferenceHandler(function ($object) {
    return 'circular_ref';
});

$serializer = new Serializer(array($normalizer), array($encoder));

            /** @var \AppBundle\Services\VideoService $videoService */
            $videoService = $this->get('app.video_service');
            $students = $videoService->getLoggedStudents($examName);
            $serialized = array();
            foreach($students as $student)
            {
                $serialized[] = $serializer->serialize($student, 'json');
            }
            $response->setData(array(
                'students' => $serialized
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

    public function shareExamAction(Request $request, $examName)
    {
        $errors = array();
        /** @var \AppBundle\Entity\Exam $exam */
        $exam = $this->getDoctrine()
            ->getRepository('AppBundle:Exam')
            ->findOneByName($examName);

        if (!$exam) {
            $errors[] = "Pas d'examen trouvé pour le nom: " . $examName;
        }

        $currentUser = $this->get('security.token_storage')->getToken()->getUser();
        if($exam->getCreator() != $currentUser)
        {
            if(!$currentUser->hasRole('ROLE_ADMIN'))
            {
                $errors[] = "Vous n'êtes pas autorisé à gérer les droits de cet examen";
            }
        }


        $admins = array();
        $allowed = array();
        $not_allowed = array();
        $users = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findAll();
        foreach($users as $user)
        {
            if($user != $exam->getCreator())
            {
                if($user->hasRole('ROLE_ADMIN'))
                {
                    $admins[] = $user;
                }
                else if($user->isAllowedToWatchExam($exam))
                {
                    $allowed[] = $user;
                }
                else
                {
                    $not_allowed[] = $user;
                }
            }
        }
        if(!empty($errors))
        {
            return $this->render('AppBundle:Static:share_exam_forbidden.html.twig', array(
                'exam' => $exam,
                'errors' => $errors
            ));
        }
        else
        {
            return $this->render('AppBundle:Static:share_exam.html.twig', array(
                'exam' => $exam,
                'users' => $users,
                'allowed' => $allowed,
                'not_allowed' => $not_allowed,
                'admins' => $admins
            ));
        }
    }

    public function allowUserAction($examName, $userId)
    {

        /** @var \AppBundle\Entity\User $user */
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findOneById($userId);

        /** @var \AppBundle\Entity\Exam $exam */
        $exam = $this->getDoctrine()
            ->getRepository('AppBundle:Exam')
            ->findOneBy(
                array(
                    'name' => $examName
                )
            );
        $user->addSharedExam($exam);

        $em = $this->getDoctrine()->getManager();
        $em->merge($user);
        $em->flush();

        return $this->redirectToRoute('app_share_exam', array('examName' => $examName));
    }

    public function disallowUserAction($examName, $userId)
    {

        /** @var \AppBundle\Entity\User $user */
        $user = $this->getDoctrine()
            ->getRepository('AppBundle:User')
            ->findOneById($userId);

        /** @var \AppBundle\Entity\Exam $exam */
        $exam = $this->getDoctrine()
            ->getRepository('AppBundle:Exam')
            ->findOneBy(
                array(
                    'name' => $examName
                )
            );
        $user->removeSharedExam($exam);


        $em = $this->getDoctrine()->getManager();
        $em->merge($user);
        $em->flush();

        return $this->redirectToRoute('app_share_exam', array('examName' => $examName));
    }
}