/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.15-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: ehr_core
-- ------------------------------------------------------
-- Server version	10.11.15-MariaDB-ubu2204-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uuid` binary(16) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` longtext DEFAULT NULL,
  `authorized` tinyint(4) DEFAULT NULL,
  `info` longtext DEFAULT NULL,
  `source` tinyint(4) DEFAULT NULL,
  `fname` varchar(255) DEFAULT NULL,
  `mname` varchar(255) DEFAULT NULL,
  `lname` varchar(255) DEFAULT NULL,
  `suffix` varchar(255) DEFAULT NULL,
  `federaltaxid` varchar(255) DEFAULT NULL,
  `federaldrugid` varchar(255) DEFAULT NULL,
  `upin` varchar(255) DEFAULT NULL,
  `facility` varchar(255) DEFAULT NULL,
  `facility_id` int(11) NOT NULL DEFAULT 0,
  `see_auth` int(11) NOT NULL DEFAULT 1,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `npi` varchar(15) DEFAULT NULL,
  `title` varchar(30) DEFAULT NULL,
  `specialty` varchar(255) DEFAULT NULL,
  `billname` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `email_direct` varchar(255) NOT NULL DEFAULT '',
  `google_signin_email` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `assistant` varchar(255) DEFAULT NULL,
  `organization` varchar(255) DEFAULT NULL,
  `valedictory` varchar(255) DEFAULT NULL,
  `street` varchar(60) DEFAULT NULL,
  `streetb` varchar(60) DEFAULT NULL,
  `city` varchar(30) DEFAULT NULL,
  `state` varchar(30) DEFAULT NULL,
  `zip` varchar(20) DEFAULT NULL,
  `street2` varchar(60) DEFAULT NULL,
  `streetb2` varchar(60) DEFAULT NULL,
  `city2` varchar(30) DEFAULT NULL,
  `state2` varchar(30) DEFAULT NULL,
  `zip2` varchar(20) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `fax` varchar(30) DEFAULT NULL,
  `phonew1` varchar(30) DEFAULT NULL,
  `phonew2` varchar(30) DEFAULT NULL,
  `phonecell` varchar(30) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `cal_ui` tinyint(4) NOT NULL DEFAULT 1,
  `taxonomy` varchar(30) NOT NULL DEFAULT '207Q00000X',
  `calendar` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = appears in calendar',
  `abook_type` varchar(31) NOT NULL DEFAULT '',
  `default_warehouse` varchar(31) NOT NULL DEFAULT '',
  `irnpool` varchar(31) NOT NULL DEFAULT '',
  `state_license_number` varchar(25) DEFAULT NULL,
  `weno_prov_id` varchar(15) DEFAULT NULL,
  `newcrop_user_role` varchar(30) DEFAULT NULL,
  `cpoe` tinyint(1) DEFAULT NULL,
  `physician_type` varchar(50) DEFAULT NULL,
  `main_menu_role` varchar(50) NOT NULL DEFAULT 'standard',
  `patient_menu_role` varchar(50) NOT NULL DEFAULT 'standard',
  `portal_user` tinyint(1) NOT NULL DEFAULT 0,
  `supervisor_id` int(11) NOT NULL DEFAULT 0,
  `billing_facility` text DEFAULT NULL,
  `billing_facility_id` int(11) NOT NULL DEFAULT 0,
  `date_created` datetime NOT NULL DEFAULT current_timestamp(),
  `last_updated` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_signin_email` (`google_signin_email`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `abook_type` (`abook_type`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,NULL,'admin','NoLongerUsed',1,NULL,NULL,'',NULL,'Administrator',NULL,NULL,NULL,NULL,NULL,3,1,1,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,3,'207Q00000X',1,'','','',NULL,NULL,NULL,NULL,NULL,'standard','standard',0,0,NULL,0,'2025-12-14 23:25:55','2025-12-14 23:25:55'),
(2,NULL,'phimail-service','NoLogin',0,NULL,NULL,NULL,NULL,'phiMail Gateway',NULL,NULL,NULL,NULL,NULL,0,1,0,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'207Q00000X',0,'','','',NULL,NULL,NULL,NULL,NULL,'standard','standard',0,0,NULL,0,'2025-12-14 23:25:55','2025-12-14 23:25:55'),
(3,NULL,'portal-user','NoLogin',0,NULL,NULL,NULL,NULL,'Patient Portal User',NULL,NULL,NULL,NULL,NULL,0,1,0,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'207Q00000X',0,'','','',NULL,NULL,NULL,NULL,NULL,'standard','standard',0,0,NULL,0,'2025-12-14 23:25:55','2025-12-14 23:25:55'),
(4,NULL,'oe-system','NoLogin',0,NULL,NULL,NULL,NULL,'System Operation User',NULL,NULL,NULL,NULL,NULL,0,1,0,NULL,NULL,NULL,NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,'207Q00000X',0,'','','',NULL,NULL,NULL,NULL,NULL,'standard','standard',0,0,NULL,0,'2025-12-14 23:25:55','2025-12-14 23:25:55');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users_secure`
--

DROP TABLE IF EXISTS `users_secure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users_secure` (
  `id` bigint(20) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `last_update_password` datetime DEFAULT NULL,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `password_history1` varchar(255) DEFAULT NULL,
  `password_history2` varchar(255) DEFAULT NULL,
  `password_history3` varchar(255) DEFAULT NULL,
  `password_history4` varchar(255) DEFAULT NULL,
  `last_challenge_response` datetime DEFAULT NULL,
  `login_work_area` text DEFAULT NULL,
  `total_login_fail_counter` bigint(20) DEFAULT 0,
  `login_fail_counter` int(11) DEFAULT 0,
  `last_login_fail` datetime DEFAULT NULL,
  `auto_block_emailed` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `USERNAME_ID` (`id`,`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users_secure`
--

LOCK TABLES `users_secure` WRITE;
/*!40000 ALTER TABLE `users_secure` DISABLE KEYS */;
INSERT INTO `users_secure` VALUES
(1,'admin','$2y$10$ecqSV96NWXyXSgS.Iq5LPOk4AsVbxYvEIgOJoFPpnqyKxbccH167q','2025-12-14 23:25:55','2025-12-14 16:25:55',NULL,NULL,NULL,NULL,NULL,NULL,0,0,NULL,0);
/*!40000 ALTER TABLE `users_secure` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-30  5:31:51
