-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: sis
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `section_id` int NOT NULL,
  `schedule_id` int NOT NULL,
  `date` date NOT NULL,
  `status` enum('present','absent') NOT NULL,
  `recorded_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attendance` (`student_id`,`schedule_id`,`date`),
  KEY `section_id` (`section_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `recorded_by` (`recorded_by`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `attendance_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`),
  CONSTRAINT `attendance_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `course_schedule` (`id`),
  CONSTRAINT `attendance_ibfk_4` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (4,202311094,2,1,'2026-05-06','absent',201412345,'2026-05-03 10:50:56');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_enrollments`
--

DROP TABLE IF EXISTS `course_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `section_id` int NOT NULL,
  `enrolled_at` date NOT NULL,
  `semester_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`student_id`,`section_id`),
  KEY `section_id` (`section_id`),
  KEY `semester_id` (`semester_id`),
  CONSTRAINT `course_enrollments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `course_enrollments_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_enrollments_ibfk_3` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_enrollments`
--

LOCK TABLES `course_enrollments` WRITE;
/*!40000 ALTER TABLE `course_enrollments` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_prerequisites`
--

DROP TABLE IF EXISTS `course_prerequisites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_prerequisites` (
  `course_id` varchar(30) NOT NULL,
  `prerequisite_id` varchar(30) NOT NULL,
  PRIMARY KEY (`course_id`,`prerequisite_id`),
  KEY `prerequisite_id` (`prerequisite_id`),
  CONSTRAINT `course_prerequisites_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_prerequisites_ibfk_2` FOREIGN KEY (`prerequisite_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_prerequisites`
--

LOCK TABLES `course_prerequisites` WRITE;
/*!40000 ALTER TABLE `course_prerequisites` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_prerequisites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_schedule`
--

DROP TABLE IF EXISTS `course_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_schedule` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_id` int NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `room` varchar(50) DEFAULT NULL,
  `building` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `section_id` (`section_id`),
  CONSTRAINT `course_schedule_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_schedule`
--

LOCK TABLES `course_schedule` WRITE;
/*!40000 ALTER TABLE `course_schedule` DISABLE KEYS */;
INSERT INTO `course_schedule` VALUES (1,2,'Wednesday','08:30:00','09:45:00','2.4','D'),(2,2,'Wednesday','10:00:00','11:15:00','2.4','D'),(3,3,'Wednesday','11:30:00','12:45:00','1.16','B'),(4,3,'Wednesday','13:00:00','14:15:00','1.16','B'),(5,4,'Friday','08:30:00','09:45:00','2.4','B'),(6,4,'Friday','10:00:00','11:15:00','2.4','B');
/*!40000 ALTER TABLE `course_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_sections`
--

DROP TABLE IF EXISTS `course_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` varchar(30) NOT NULL,
  `section_code` varchar(10) NOT NULL,
  `instructor_id` int DEFAULT NULL,
  `seats` int NOT NULL,
  `max_seats` int DEFAULT NULL,
  `semester_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_section` (`course_id`,`section_code`),
  KEY `fk_section_instructor` (`instructor_id`),
  KEY `semester_id` (`semester_id`),
  CONSTRAINT `course_sections_ibfk_1` FOREIGN KEY (`semester_id`) REFERENCES `semesters` (`id`),
  CONSTRAINT `fk_section_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_section_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `instructors` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_sections`
--

LOCK TABLES `course_sections` WRITE;
/*!40000 ALTER TABLE `course_sections` DISABLE KEYS */;
INSERT INTO `course_sections` VALUES (2,'PROG 121-EC01','4775',201412345,30,30,NULL),(3,'PROG 121-EC01','4776',NULL,24,25,NULL),(4,'COMM 120-CM01','1000',NULL,25,25,1);
/*!40000 ALTER TABLE `course_sections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` varchar(30) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `credits` int NOT NULL,
  `major_id` int NOT NULL,
  `type` enum('major','elective') NOT NULL,
  `offered_in` enum('Fall','Spring','Both') DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_courses_major` (`major_id`),
  CONSTRAINT `fk_courses_major` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES ('COMM 120-CM01','Citizenship ','Testttt',3,1,'elective',NULL),('NETW 228-EC00','Computer Networks','Everything related to computer networks',3,1,'major',NULL),('PROG 121-EC01','Programming I','This course involves structural programming using the C/C++ language. This course will allow the student to acquire basic knowledge in structural programming. This course explains variables, basic operators, selection, repititions, arrays, functions and procedures.',3,1,'major',NULL),('PROG 121-EP01','Lab Programming I','This Lab aims to familiarize the student with the programming environment. The student will have exercises to write using a programming language.',1,1,'major',NULL);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `building` varchar(100) DEFAULT NULL,
  `office` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Technology','Building D','Office D1.1','01-555-444','uatech@ua.edu.lb'),(2,'Engineering','Building D','Office D1.2','01-555-666','uaeng@ua.edu.lb');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finance_officers`
--

DROP TABLE IF EXISTS `finance_officers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finance_officers` (
  `user_id` int NOT NULL,
  `office_location` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `finance_officers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finance_officers`
--

LOCK TABLES `finance_officers` WRITE;
/*!40000 ALTER TABLE `finance_officers` DISABLE KEYS */;
INSERT INTO `finance_officers` VALUES (202000001,'Building A, Room 1.12');
/*!40000 ALTER TABLE `finance_officers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grade_components`
--

DROP TABLE IF EXISTS `grade_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grade_components` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `max_grade` decimal(5,2) NOT NULL,
  `weight` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `grade_components_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grade_components`
--

LOCK TABLES `grade_components` WRITE;
/*!40000 ALTER TABLE `grade_components` DISABLE KEYS */;
INSERT INTO `grade_components` VALUES (2,'PROG 121-EC01','Classwork',100.00,20.00),(3,'PROG 121-EC01','Midterm',100.00,35.00);
/*!40000 ALTER TABLE `grade_components` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instructors`
--

DROP TABLE IF EXISTS `instructors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instructors` (
  `user_id` int NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `instructors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instructors`
--

LOCK TABLES `instructors` WRITE;
/*!40000 ALTER TABLE `instructors` DISABLE KEYS */;
INSERT INTO `instructors` VALUES (201412345,'1');
/*!40000 ALTER TABLE `instructors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `majors`
--

DROP TABLE IF EXISTS `majors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `majors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `department_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `degree_type` enum('Bachelor','Master','PhD') NOT NULL,
  `total_credits_required` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `department_id` (`department_id`),
  CONSTRAINT `majors_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `majors`
--

LOCK TABLES `majors` WRITE;
/*!40000 ALTER TABLE `majors` DISABLE KEYS */;
INSERT INTO `majors` VALUES (1,1,'Computer Science','Bachelor',96),(2,2,'Computer and Communication Engineering','Bachelor',156);
/*!40000 ALTER TABLE `majors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_questions`
--

DROP TABLE IF EXISTS `quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `field` varchar(100) NOT NULL,
  `difficulty` tinyint NOT NULL,
  `type` varchar(50) NOT NULL,
  `question` text NOT NULL,
  `code` text,
  `code_lines` json DEFAULT NULL,
  `options` json NOT NULL,
  `answer` varchar(1) NOT NULL,
  `explanation` text,
  `used_count` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_questions`
--

LOCK TABLES `quiz_questions` WRITE;
/*!40000 ALTER TABLE `quiz_questions` DISABLE KEYS */;
INSERT INTO `quiz_questions` VALUES (1,'Computer Science',2,'mcq','What is the primary function of an operating system?',NULL,NULL,'{\"A\": \"Manage hardware and software resources\", \"B\": \"Develop software applications\", \"C\": \"Create network protocols\", \"D\": \"Compile programming languages\"}','A','The primary function of an operating system is to manage hardware and software resources, acting as an intermediary between users and the computer hardware.',2,'2026-05-09 10:34:06'),(2,'Computer Science',2,'output_prediction','What does this code output?','x = 5\nprint(x * 2)',NULL,'{\"A\": \"5\", \"B\": \"10\", \"C\": \"25\", \"D\": \"Error\"}','B','The code multiplies the value of x (which is 5) by 2, resulting in 10, which is what gets printed.',1,'2026-05-09 10:34:06'),(3,'Computer Science',2,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"def add(a, b):\", \"B\": \"    result = a - b\", \"C\": \"    return result\", \"D\": \"print(add(2, 3))\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','B','The bug is in Line B where it uses subtraction instead of addition. It should be \'result = a + b\' to correctly add the two numbers.',1,'2026-05-09 10:34:06'),(4,'Computer Science',2,'scenario','You are tasked with developing a mobile application. What is the first step you should take?',NULL,NULL,'{\"A\": \"Start coding the app\", \"B\": \"Conduct market research\", \"C\": \"Design the user interface\", \"D\": \"Choose the programming language\"}','B','Conducting market research is crucial as it helps identify user needs and preferences, which should guide the development of the app.',2,'2026-05-09 10:34:06'),(5,'Computer Science',3,'mcq','Which of the following is a key characteristic of functional programming?',NULL,NULL,'{\"A\": \"State is mutable\", \"B\": \"Functions are first-class citizens\", \"C\": \"Focus on object-oriented design\", \"D\": \"Use of side effects\"}','B','Functional programming treats functions as first-class citizens, allowing them to be passed as arguments, returned from other functions, and assigned to variables.',1,'2026-05-09 15:50:07'),(6,'Computer Science',3,'output_prediction','What does this code output?','def square(x):\n    return x * x\nprint(square(4))',NULL,'{\"A\": \"4\", \"B\": \"8\", \"C\": \"16\", \"D\": \"Error\"}','C','The function square calculates the square of the input (4), which is 16, and this is what is printed.',1,'2026-05-09 15:50:07'),(7,'Computer Science',3,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"def multiply(a, b):\", \"B\": \"    return a * b\", \"C\": \"print(multiply(2))\", \"D\": \"print(multiply(2, 3))\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','C','Line C is missing the second argument for the multiply function, which requires two parameters.',1,'2026-05-09 15:50:07'),(8,'Computer Science',3,'scenario','You are tasked with improving the performance of a web application. Which approach would be most effective?',NULL,NULL,'{\"A\": \"Add more logging to track performance issues\", \"B\": \"Optimize the database queries\", \"C\": \"Increase the server\'s RAM\", \"D\": \"Change the application framework\"}','B','Optimizing database queries directly addresses performance bottlenecks that often affect web application speed, making it the most effective approach.',1,'2026-05-09 15:50:07'),(9,'Computer Science',2,'mcq','What is the primary purpose of an algorithm?',NULL,NULL,'{\"A\": \"To provide a step-by-step solution to a problem\", \"B\": \"To store data efficiently\", \"C\": \"To create user interfaces\", \"D\": \"To manage hardware resources\"}','A','An algorithm is a defined set of instructions to solve a specific problem or task, making option A the correct answer.',1,'2026-05-09 15:55:13'),(10,'Computer Science',2,'output_prediction','What does this code output?','x = 5\nprint(x * 2)',NULL,'{\"A\": \"5\", \"B\": \"10\", \"C\": \"25\", \"D\": \"Error\"}','B','The code multiplies the variable x, which is 5, by 2, resulting in 10 being printed.',0,'2026-05-09 15:55:13'),(11,'Computer Science',2,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"def add(a, b):\", \"B\": \"    result = a - b\", \"C\": \"    return result\", \"D\": \"print(add(2, 3))\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','B','Line B contains a bug because it uses subtraction instead of addition. The correct line should be \'result = a + b\'.',1,'2026-05-09 15:55:13'),(12,'Computer Science',2,'scenario','You are part of a team developing a new software application. What is the first step in the software development lifecycle?',NULL,NULL,'{\"A\": \"Testing the application\", \"B\": \"Writing the code\", \"C\": \"Gathering requirements\", \"D\": \"Deploying the software\"}','C','The first step in the software development lifecycle is gathering requirements to understand what the application needs to achieve.',1,'2026-05-09 15:55:13'),(13,'Mobile Development',2,'mcq','Which of the following is a primary language used for Android app development?',NULL,NULL,'{\"A\": \"Java\", \"B\": \"Swift\", \"C\": \"C#\", \"D\": \"Kotlin\"}','A','Java is one of the primary languages used for Android app development, along with Kotlin.',1,'2026-05-09 16:22:32'),(14,'Mobile Development',2,'output_prediction','What does this code output?','x = 10\nprint(x // 3)',NULL,'{\"A\": \"3\", \"B\": \"3.33\", \"C\": \"30\", \"D\": \"Error\"}','A','The \'//\' operator performs floor division, so 10 // 3 equals 3.',0,'2026-05-09 16:22:32'),(15,'Mobile Development',2,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"def multiply(a, b):\", \"B\": \"    result = a + b\", \"C\": \"    return result\", \"D\": \"print(multiply(4, 5))\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','B','Line B has a bug because it uses addition instead of multiplication. It should be \'result = a * b\'.',0,'2026-05-09 16:22:32'),(16,'Mobile Development',2,'scenario','You are developing a mobile app that requires users to log in. What is the best practice for handling user passwords?',NULL,NULL,'{\"A\": \"Store passwords in plain text for easy access\", \"B\": \"Hash passwords before storing them\", \"C\": \"Encrypt passwords with a simple algorithm\", \"D\": \"Use the user\'s email as the password\"}','B','The best practice is to hash passwords before storing them to enhance security, preventing exposure of plain text passwords.',0,'2026-05-09 16:22:32'),(17,'Mobile Development using React Native',2,'mcq','Which of the following is a primary benefit of using React Native for mobile development?',NULL,NULL,'{\"A\": \"Cross-platform development\", \"B\": \"Native UI components only\", \"C\": \"Requires separate codebases for iOS and Android\", \"D\": \"Limited community support\"}','A','React Native allows developers to write code once and deploy it on both iOS and Android platforms, which saves time and resources.',2,'2026-05-09 16:25:57'),(18,'Mobile Development using React Native',2,'output_prediction','What does this code output?','const x = 5;\nconsole.log(x * 2);',NULL,'{\"A\": \"5\", \"B\": \"10\", \"C\": \"25\", \"D\": \"Error\"}','B','The code multiplies the value of x (5) by 2, resulting in 10, which is then logged to the console.',2,'2026-05-09 16:25:57'),(19,'Mobile Development using React Native',2,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"const MyComponent = () => {\", \"B\": \"  return <Text>Hello World</Text>\", \"C\": \"  }\", \"D\": \"export default MyComponent;\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','C','Line C has incorrect syntax as it does not properly close the function. It should be \'};\' instead of just \'}\'.',1,'2026-05-09 16:25:57'),(20,'Mobile Development using React Native',2,'scenario','You are developing a mobile app using React Native, and the app requires real-time data updates. Which approach would you use?',NULL,NULL,'{\"A\": \"Fetch data using a static API call\", \"B\": \"Use WebSockets for real-time communication\", \"C\": \"Poll the server every minute\", \"D\": \"Load data only on app launch\"}','B','Using WebSockets allows for real-time communication between the client and server, enabling instant updates in the app, which is critical for dynamic applications.',1,'2026-05-09 16:25:57'),(21,'Mobile Development using React Native',2,'mcq','Which of the following is an advantage of using React Native for mobile development?',NULL,NULL,'{\"A\": \"Single codebase for iOS and Android\", \"B\": \"Native performance on all platforms\", \"C\": \"No need for JavaScript knowledge\", \"D\": \"Automatic updates without user consent\"}','A','React Native allows developers to write code once and deploy it on both iOS and Android platforms, which significantly reduces development time and effort.',2,'2026-05-09 16:28:22'),(22,'Mobile Development using React Native',2,'output_prediction','What does this code output?','const a = 10; const b = 5; console.log(a + b);',NULL,'{\"A\": \"5\", \"B\": \"10\", \"C\": \"15\", \"D\": \"Error\"}','C','The code adds variables \'a\' and \'b\', which results in 10 + 5 = 15, and logs it to the console.',1,'2026-05-09 16:28:22'),(23,'Mobile Development using React Native',2,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"import React from \'react\';\", \"B\": \"const App = () => {\", \"C\": \"return <Text>Hello World</Text>;\", \"D\": \"export default App;\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','C','Line C is incorrect because it lacks the necessary \'()\' around \'Text\', which should be \'<Text>Hello World</Text>\' with proper JSX syntax.',2,'2026-05-09 16:28:23'),(24,'Mobile Development using React Native',2,'scenario','You are developing a mobile app using React Native and need to implement navigation. Which library would you choose for efficient navigation management?',NULL,NULL,'{\"A\": \"React Router\", \"B\": \"React Navigation\", \"C\": \"Vue Router\", \"D\": \"Angular Router\"}','B','React Navigation is specifically designed for React Native applications, providing a simple and customizable navigation solution for mobile development.',1,'2026-05-09 16:28:23'),(25,'Mobile Development using React Native',2,'mcq','Which of the following is NOT a core component of React Native?',NULL,NULL,'{\"A\": \"View\", \"B\": \"Text\", \"C\": \"Button\", \"D\": \"Grid\"}','D','Grid is not a core component of React Native; it can be implemented using Flexbox.',1,'2026-05-09 16:30:47'),(26,'Mobile Development using React Native',2,'output_prediction','What does this code output?','const num = 10;\nconsole.log(num + 5);',NULL,'{\"A\": \"10\", \"B\": \"15\", \"C\": \"105\", \"D\": \"Error\"}','B','The code adds 5 to 10, resulting in 15, which is printed to the console.',1,'2026-05-09 16:30:47'),(27,'Mobile Development using React Native',2,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"const MyComponent = () => {\", \"B\": \"    return <Text>Hello World</Text>;\", \"C\": \"};\", \"D\": \"export default MyComponent;\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','C','Line C is missing a return statement to properly return the JSX from the functional component.',1,'2026-05-09 16:30:47'),(28,'Mobile Development using React Native',2,'scenario','You need to create a mobile app that requires real-time data updates. Which React Native library would be most suitable for this purpose?',NULL,NULL,'{\"A\": \"React Navigation\", \"B\": \"Firebase\", \"C\": \"React Native Paper\", \"D\": \"React Native Web\"}','B','Firebase provides real-time database capabilities that would allow for real-time data updates in the mobile app.',1,'2026-05-09 16:30:47'),(29,'Mobile Development using React Native',1,'mcq','What is React Native primarily used for?',NULL,NULL,'{\"A\": \"Building web applications\", \"B\": \"Creating mobile applications\", \"C\": \"Developing server-side applications\", \"D\": \"Designing database schemas\"}','B','React Native is specifically designed for creating mobile applications using JavaScript and React.',1,'2026-05-10 13:53:30'),(30,'Mobile Development using React Native',1,'output_prediction','What does this code output?','const num = 3;\nconsole.log(num + 2);',NULL,'{\"A\": \"3\", \"B\": \"5\", \"C\": \"32\", \"D\": \"Error\"}','B','The code adds 2 to the variable \'num\' which is 3, resulting in 5.',1,'2026-05-10 13:53:30'),(31,'Mobile Development using React Native',1,'spot_the_bug','Which line contains the bug?',NULL,'{\"A\": \"import React from \'react\';\", \"B\": \"import { View, Text } from \'react-native\';\", \"C\": \"const App = () => {\", \"D\": \"return <Text>Hello World</Text>\"}','{\"A\": \"Line A\", \"B\": \"Line B\", \"C\": \"Line C\", \"D\": \"Line D\"}','D','Line D is missing a closing tag for the component; it should be <Text>Hello World</Text>.',1,'2026-05-10 13:53:30'),(32,'Mobile Development using React Native',1,'scenario','You want to create a button in your React Native app that performs an action when pressed. Which component should you use?',NULL,NULL,'{\"A\": \"TouchableOpacity\", \"B\": \"View\", \"C\": \"Text\", \"D\": \"Image\"}','A','TouchableOpacity is the correct component to create a button that can respond to press events in React Native.',1,'2026-05-10 13:53:30');
/*!40000 ALTER TABLE `quiz_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_responses`
--

DROP TABLE IF EXISTS `quiz_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `question_id` int NOT NULL,
  `selected_option` varchar(1) NOT NULL,
  `student_explanation` text NOT NULL,
  `option_correct` tinyint(1) NOT NULL,
  `explanation_score` tinyint NOT NULL,
  `final_score` tinyint NOT NULL,
  `difficulty` tinyint NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `session_id` (`session_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `quiz_responses_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `quiz_sessions` (`id`),
  CONSTRAINT `quiz_responses_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `quiz_questions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_responses`
--

LOCK TABLES `quiz_responses` WRITE;
/*!40000 ALTER TABLE `quiz_responses` DISABLE KEYS */;
INSERT INTO `quiz_responses` VALUES (1,3,2,'B','Since X=5, and we are calling x which is 5 and multiplying it by 2',1,7,10,2,'2026-05-09 15:48:03'),(2,3,3,'B','The line does not contain ; at the end of the line',1,5,7,2,'2026-05-09 15:49:03'),(3,3,1,'A','The oprating system acts as the brain of the computer, which manage everything inside it, and without it nothing can happen',1,7,10,2,'2026-05-09 15:49:52'),(4,3,5,'A','State is a key characteristic of functional prog',0,2,0,3,'2026-05-09 15:53:08'),(5,3,4,'B','Before starting with any project, we must conduct an analysis phase where we define requirements, market research, and user needs',1,9,10,2,'2026-05-09 15:54:08'),(6,3,6,'C','4 is passed as a parameter, so it returns 4 times 4 which is 16',1,5,7,3,'2026-05-09 15:54:41'),(7,3,8,'C','So it can act fastly',0,2,0,3,'2026-05-09 15:55:06'),(8,3,9,'A','Algorithm is a way to solve an existing problem',1,5,7,2,'2026-05-09 15:55:38'),(9,3,12,'C','Gatyhering requirements so we can define yser needs and plan our project',1,8,10,2,'2026-05-09 15:56:14'),(10,3,7,'C','The function accepts 2 parameters, but this calling pass just 1',1,7,10,3,'2026-05-09 15:57:14'),(11,6,17,'A','React native allows development on both iOS and Android, so cross platform development is the primary benefit',1,8,10,2,'2026-05-09 16:26:35'),(12,6,19,'A','We are noth wrappint the Text inside a paranthesis',0,2,0,2,'2026-05-09 16:27:06'),(13,6,18,'B','Since x = 5 and we are multiplying x hy 2 so 5 times 2 =10',1,7,10,2,'2026-05-09 16:27:40'),(14,6,20,'B','Real time communication',1,3,5,2,'2026-05-09 16:28:08'),(15,6,23,'A','It should be import ‘react’ from the React framework, not like this',0,4,2,2,'2026-05-09 16:28:55'),(16,6,21,'A','Cross platform development',1,6,7,2,'2026-05-09 16:29:17'),(17,6,24,'B','It is used for navigating',1,3,5,2,'2026-05-09 16:30:05'),(18,6,22,'C','Since 10+5 = 15',1,3,5,2,'2026-05-09 16:30:33'),(19,6,25,'C','Touchable opacity instead',0,3,0,2,'2026-05-09 16:31:11'),(20,6,26,'B','Since 10 + 5 = 15',1,3,5,2,'2026-05-09 16:31:31'),(21,7,28,'C','Since it includes real time updates',0,3,0,2,'2026-05-10 13:52:59'),(22,7,27,'A','This is not how we declare a function',0,3,0,2,'2026-05-10 13:53:22'),(23,7,29,'B','React native is a corsa platform mobile development framework',1,4,7,1,'2026-05-10 13:53:54'),(24,7,30,'B','Since we passed num which is 3 and added it to 2 so it is 5',1,5,7,1,'2026-05-10 13:54:13'),(25,7,21,'A','It is a corsa platform application develipment framework',1,3,5,2,'2026-05-10 13:54:59'),(26,7,18,'B','Since 5 times 2 is 10',1,3,5,2,'2026-05-10 13:55:14'),(27,7,17,'A','Cross platform development',1,6,7,2,'2026-05-10 13:55:32'),(28,7,23,'A','It is reversed, we import react from the React',0,2,0,2,'2026-05-10 13:55:57'),(29,7,32,'A','Since it acts as a button',1,3,5,1,'2026-05-10 13:56:13'),(30,7,31,'A','It is reversed we import react from React',0,3,0,1,'2026-05-10 13:56:28');
/*!40000 ALTER TABLE `quiz_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_sessions`
--

DROP TABLE IF EXISTS `quiz_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `field_of_interest` varchar(100) NOT NULL,
  `theta` decimal(5,2) DEFAULT '0.00',
  `questions_answered` int DEFAULT '0',
  `skill_score` decimal(5,2) DEFAULT NULL,
  `status` enum('active','completed') DEFAULT 'active',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `quiz_sessions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_sessions`
--

LOCK TABLES `quiz_sessions` WRITE;
/*!40000 ALTER TABLE `quiz_sessions` DISABLE KEYS */;
INSERT INTO `quiz_sessions` VALUES (1,202311094,'Computer Science',0.00,0,NULL,'completed','2026-05-09 10:33:56',NULL),(2,202311094,'Computer Science',0.00,0,NULL,'completed','2026-05-09 15:43:53',NULL),(3,202311094,'Computer Science',2.34,10,89.00,'completed','2026-05-09 15:47:28','2026-05-09 15:57:14'),(4,202311094,'Computer Science',0.00,0,NULL,'completed','2026-05-09 15:57:35',NULL),(5,202311094,'Mobile Development',0.00,0,NULL,'completed','2026-05-09 16:22:12',NULL),(6,202311094,'Mobile Development using React Native',-0.12,10,48.00,'completed','2026-05-09 16:25:34','2026-05-09 16:31:31'),(7,202311094,'Mobile Development using React Native',-1.62,10,23.00,'completed','2026-05-10 13:52:35','2026-05-10 13:56:28');
/*!40000 ALTER TABLE `quiz_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `semesters`
--

DROP TABLE IF EXISTS `semesters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semesters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `code` varchar(20) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `term` enum('Fall','Spring','Summer') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `enrollment_start_date` date DEFAULT NULL,
  `enrollment_end_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_current` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `semesters`
--

LOCK TABLES `semesters` WRITE;
/*!40000 ALTER TABLE `semesters` DISABLE KEYS */;
INSERT INTO `semesters` VALUES (1,'Spring 2026','S2026','2025-2026','Spring','2026-01-29','2026-04-24','2026-01-21','2026-01-28',1,1,'2026-05-19 21:54:39'),(2,'Fall 2026','F2026','2026-2027','Fall','2026-09-14','2026-12-04','2026-09-07','2026-09-13',0,0,'2026-05-19 21:57:27');
/*!40000 ALTER TABLE `semesters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shopping_cart`
--

DROP TABLE IF EXISTS `shopping_cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopping_cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `course_id` varchar(30) NOT NULL,
  `section_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_cart_item` (`student_id`,`course_id`,`section_id`),
  KEY `cart_ibfk_2` (`course_id`),
  KEY `fk_section` (`section_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_section` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopping_cart`
--

LOCK TABLES `shopping_cart` WRITE;
/*!40000 ALTER TABLE `shopping_cart` DISABLE KEYS */;
INSERT INTO `shopping_cart` VALUES (33,202311094,'PROG 121-EC01',2,'2026-05-19 19:15:28'),(34,202311094,'COMM 120-CM01',4,'2026-05-19 22:19:18');
/*!40000 ALTER TABLE `shopping_cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_financial_transactions`
--

DROP TABLE IF EXISTS `student_financial_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_financial_transactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `payment_id` bigint DEFAULT NULL,
  `type` varchar(50) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `amount_paid` decimal(10,2) DEFAULT '0.00',
  `status` varchar(50) DEFAULT NULL,
  `payment_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `payment_id` (`payment_id`),
  CONSTRAINT `student_financial_transactions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_financial_transactions`
--

LOCK TABLES `student_financial_transactions` WRITE;
/*!40000 ALTER TABLE `student_financial_transactions` DISABLE KEYS */;
INSERT INTO `student_financial_transactions` VALUES (3,202311094,3,'registration','Spring Semester 2025-2026','2026-05-12',250.00,0.00,'pending',NULL,'2026-05-07 11:22:39','2026-05-07 11:22:39');
/*!40000 ALTER TABLE `student_financial_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_grades`
--

DROP TABLE IF EXISTS `student_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `section_id` int NOT NULL,
  `component_id` int NOT NULL,
  `grade` decimal(5,2) DEFAULT NULL,
  `recorded_by` int NOT NULL,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_grade` (`student_id`,`section_id`,`component_id`),
  KEY `section_id` (`section_id`),
  KEY `component_id` (`component_id`),
  KEY `recorded_by` (`recorded_by`),
  CONSTRAINT `student_grades_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `student_grades_ibfk_2` FOREIGN KEY (`section_id`) REFERENCES `course_sections` (`id`),
  CONSTRAINT `student_grades_ibfk_3` FOREIGN KEY (`component_id`) REFERENCES `grade_components` (`id`),
  CONSTRAINT `student_grades_ibfk_4` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_grades`
--

LOCK TABLES `student_grades` WRITE;
/*!40000 ALTER TABLE `student_grades` DISABLE KEYS */;
INSERT INTO `student_grades` VALUES (1,202311094,2,2,89.00,201412345,'2026-05-03 16:07:50');
/*!40000 ALTER TABLE `student_grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `user_id` int NOT NULL,
  `major_id` int NOT NULL,
  `enrollment_date` date NOT NULL,
  `completed_credits` int DEFAULT '0',
  `gpa` decimal(3,2) DEFAULT '0.00',
  `campus` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  KEY `major_id` (`major_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`major_id`) REFERENCES `majors` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (202311094,1,'2023-05-18',0,0.00,'Baabda');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','instructor','admin','finance_officer') DEFAULT NULL,
  `dob` date NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (201412345,'Ali Ibrahim','$2b$10$dsm7ztdFg5mCccYtGeKap.Mtx7zOnNWFCo6BOcyc33vZPHzLk6N16','instructor','1991-04-29','aliibrahim@ua.edu.lb','71123456','active'),(202000000,'Admin Zein','$2b$10$C3erntex7U.qwzQnURh5IOFJJdnbIIcM/aCd5gWPvy4xA8GJi.zBC','admin','1990-04-22',NULL,NULL,'active'),(202000001,'Finance Ali','$2b$10$6vcRnjaHwe35Blda8J4K8ON..j34tkcZ4dhv5HOLGebJ18PH/6YcK','finance_officer','2000-01-29','aliFinance@ua.edu.lb','03000001','active'),(202311094,'Zein Al Abidin Sawly','$2b$10$p3xCYHSO/h13NQHahZb3PuQ3nhLseXksLfkjtCEG38R8XrapJulpO','student','2005-07-27','zeinsawly@ua.edu.lb','70629507','active');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sis'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-20 17:14:51
