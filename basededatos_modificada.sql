-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         11.4.9-MariaDB - MariaDB Server
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.11.0.7065
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
CREATE DATABASE IF NOT EXISTS `fitstation` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;
USE `fitstation`;

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

-- Volcando estructura para tabla fitstation.clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id_client` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `goal` text DEFAULT NULL,
  PRIMARY KEY (`id_client`),
  UNIQUE KEY `id_user` (`id_user`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
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

-- Volcando estructura para tabla fitstation.conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id_conversation` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id_conversation`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
  `message` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_message`),
  KEY `id_conversation` (`id_conversation`),
  KEY `id_sender` (`id_sender`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`id_conversation`) REFERENCES `conversations` (`id_conversation`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`id_sender`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
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

-- Volcando estructura para tabla fitstation.services
CREATE TABLE IF NOT EXISTS `services` (
  `id_service` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id_service`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- La exportación de datos fue deseleccionada.

-- Volcando estructura para tabla fitstation.workers
CREATE TABLE IF NOT EXISTS `workers` (
  `id_worker` int(11) NOT NULL AUTO_INCREMENT,
  `id_user` int(11) NOT NULL,
  `specialty` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_worker`),
  UNIQUE KEY `id_user` (`id_user`),
  CONSTRAINT `workers_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
