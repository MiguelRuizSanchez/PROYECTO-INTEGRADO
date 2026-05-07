-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         12.2.2-MariaDB - MariaDB Server
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.14.0.7165
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para fitstation
CREATE DATABASE IF NOT EXISTS `fitstation` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;
USE `fitstation`;

-- Volcando estructura para tabla fitstation.availabilities
CREATE TABLE IF NOT EXISTS `availabilities` (
  `id_availability` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `day_of_week` tinyint(4) NOT NULL COMMENT '1:Lunes, 7:Domingo',
  `start_time` time NOT NULL,
  `is_taken` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id_availability`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `fk_availability_user` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.bookings
CREATE TABLE IF NOT EXISTS `bookings` (
  `id_booking` int(11) NOT NULL AUTO_INCREMENT,
  `id_client` int(11) NOT NULL,
  `id_class` int(11) DEFAULT NULL,
  `id_service` int(11) DEFAULT NULL,
  `booking_date` datetime NOT NULL,
  `status` enum('active','cancelled') NOT NULL,
  PRIMARY KEY (`id_booking`),
  KEY `id_client` (`id_client`),
  KEY `id_class` (`id_class`),
  KEY `id_service` (`id_service`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `clients` (`id_client`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`id_class`) REFERENCES `classes` (`id_class`) ON DELETE SET NULL,
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`id_service`) REFERENCES `services` (`id_service`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.classes
CREATE TABLE IF NOT EXISTS `classes` (
  `id_class` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id_class`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.client_routines
CREATE TABLE IF NOT EXISTS `client_routines` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_client` int(11) NOT NULL,
  `id_routine` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_client` (`id_client`),
  KEY `id_routine` (`id_routine`),
  CONSTRAINT `client_routines_ibfk_1` FOREIGN KEY (`id_client`) REFERENCES `clients` (`id_client`) ON DELETE CASCADE,
  CONSTRAINT `client_routines_ibfk_2` FOREIGN KEY (`id_routine`) REFERENCES `routines` (`id_routine`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id_client` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `goal` text DEFAULT NULL,
  `objectives` varchar(255) DEFAULT NULL,
  `experience_level` varchar(50) DEFAULT NULL,
  `modality` varchar(50) DEFAULT NULL,
  `medical_notes` text DEFAULT NULL,
  `equipment` varchar(255) DEFAULT NULL,
  `pref_day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  `pref_time` time DEFAULT NULL,
  PRIMARY KEY (`id_client`),
  UNIQUE KEY `id_user` (`id_user`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.conversation_users
CREATE TABLE IF NOT EXISTS `conversation_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_conversation` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_conversation` (`id_conversation`),
  KEY `id_user` (`id_user`),
  CONSTRAINT `conversation_users_ibfk_1` FOREIGN KEY (`id_conversation`) REFERENCES `conversations` (`id_conversation`) ON DELETE CASCADE,
  CONSTRAINT `conversation_users_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id_conversation` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_conversation`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.exercises
CREATE TABLE IF NOT EXISTS `exercises` (
  `id_exercise` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `muscle_group` varchar(50) NOT NULL,
  PRIMARY KEY (`id_exercise`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id_message` int(11) NOT NULL AUTO_INCREMENT,
  `id_conversation` int(11) NOT NULL,
  `id_sender` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_message`),
  KEY `id_conversation` (`id_conversation`),
  KEY `id_sender` (`id_sender`),
  CONSTRAINT `fk_msg_conversation` FOREIGN KEY (`id_conversation`) REFERENCES `conversations` (`id_conversation`),
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`id_sender`) REFERENCES `users` (`id_user`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`id_conversation`) REFERENCES `conversations` (`id_conversation`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`id_sender`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.routine_exercises
CREATE TABLE IF NOT EXISTS `routine_exercises` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_routine` int(11) NOT NULL,
  `id_exercise` int(11) NOT NULL,
  `reps` int(11) NOT NULL,
  `sets` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_routine` (`id_routine`),
  KEY `id_exercise` (`id_exercise`),
  CONSTRAINT `routine_exercises_ibfk_1` FOREIGN KEY (`id_routine`) REFERENCES `routines` (`id_routine`) ON DELETE CASCADE,
  CONSTRAINT `routine_exercises_ibfk_2` FOREIGN KEY (`id_exercise`) REFERENCES `exercises` (`id_exercise`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.routines
CREATE TABLE IF NOT EXISTS `routines` (
  `id_routine` int(11) NOT NULL AUTO_INCREMENT,
  `id_worker` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id_routine`),
  KEY `id_worker` (`id_worker`),
  CONSTRAINT `routines_ibfk_1` FOREIGN KEY (`id_worker`) REFERENCES `workers` (`id_worker`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.services
CREATE TABLE IF NOT EXISTS `services` (
  `id_service` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id_service`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id_session` int(11) NOT NULL AUTO_INCREMENT,
  `id_request` int(11) NOT NULL,
  `id_client` int(11) NOT NULL,
  `id_worker` int(11) NOT NULL,
  `scheduled_date` datetime DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT 60,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `status` varchar(20) DEFAULT 'Scheduled',
  PRIMARY KEY (`id_session`),
  KEY `FK_session_request` (`id_request`),
  CONSTRAINT `FK_session_request` FOREIGN KEY (`id_request`) REFERENCES `worker_requests` (`id_request`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.users
CREATE TABLE IF NOT EXISTS `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('client','worker','admin') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.worker_classes
CREATE TABLE IF NOT EXISTS `worker_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_worker` int(11) NOT NULL,
  `id_class` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_worker` (`id_worker`),
  KEY `id_class` (`id_class`),
  CONSTRAINT `worker_classes_ibfk_1` FOREIGN KEY (`id_worker`) REFERENCES `workers` (`id_worker`) ON DELETE CASCADE,
  CONSTRAINT `worker_classes_ibfk_2` FOREIGN KEY (`id_class`) REFERENCES `classes` (`id_class`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.worker_requests
CREATE TABLE IF NOT EXISTS `worker_requests` (
  `id_request` int(11) NOT NULL AUTO_INCREMENT,
  `id_client` int(11) NOT NULL,
  `id_worker` int(11) NOT NULL,
  `request_date` datetime DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Pending',
  `requested_day` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  `requested_time` time DEFAULT NULL,
  PRIMARY KEY (`id_request`),
  KEY `FK_client_request` (`id_client`),
  KEY `FK_worker_request` (`id_worker`),
  -- CORRECCION DE UN LEVE ERROR - ANA
  CONSTRAINT `FK_client_request` FOREIGN KEY (`id_client`) REFERENCES `clients` (`id_client`) ON DELETE CASCADE,
  CONSTRAINT `FK_worker_request` FOREIGN KEY (`id_worker`) REFERENCES `workers` (`id_worker`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.worker_services
CREATE TABLE IF NOT EXISTS `worker_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_worker` int(11) NOT NULL,
  `id_service` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_worker` (`id_worker`),
  KEY `id_service` (`id_service`),
  CONSTRAINT `worker_services_ibfk_1` FOREIGN KEY (`id_worker`) REFERENCES `workers` (`id_worker`) ON DELETE CASCADE,
  CONSTRAINT `worker_services_ibfk_2` FOREIGN KEY (`id_service`) REFERENCES `services` (`id_service`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.workers
CREATE TABLE IF NOT EXISTS `workers` (
  `id_worker` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `price_per_session` decimal(10,2) DEFAULT NULL,
  `max_capacity` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_worker`),
  UNIQUE KEY `id_user` (`id_user`),
  CONSTRAINT `workers_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
