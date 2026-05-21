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

INSERT INTO `exercises` (`name`, `description`, `muscle_group`) VALUES
-- ------------------------
-- PRIMERA PARTE DE TU LISTA
-- ------------------------
-- Pecho
('Pullover con Mancuerna', 'Acostado en un banco transversalmente, se baja una mancuerna por detrás de la cabeza con los brazos semiflexionados. Expande la caja torácica y trabaja pectorales y dorsales.', 'Pecho'),
('Press Declinado', 'Press de banca en un banco con inclinación negativa. Pone el enfoque en la porción inferior del pectoral mayor.', 'Pecho'),
('Pec Deck (Aperturas en Máquina)', 'Ejercicio en máquina que aísla el pecho simulando el movimiento de un abrazo. Excelente para mantener tensión constante sin requerir estabilización del peso.', 'Pecho'),

-- Espalda
('Remo con Mancuerna a Una Mano', 'Apoyando una rodilla y mano en un banco, se tracciona una mancuerna con el otro brazo. Permite un gran rango de recorrido y corrige asimetrías musculares.', 'Espalda'),
('Hiperextensiones', 'Ejercicio en banco romano (o en el suelo) para fortalecer la zona lumbar, glúteos e isquiotibiales.', 'Espalda'),
('Remo en Polea Baja (Gironda)', 'Tracción horizontal sentado en el suelo o banco utilizando una polea. Trabaja el grosor de la espalda (dorsales, romboides y trapecios medios).', 'Espalda'),

-- Piernas y Glúteos
('Sentadilla Búlgara', 'Sentadilla unilateral con la pierna trasera elevada sobre un banco o cajón. Exige gran equilibrio y trabaja intensamente cuádriceps y glúteos.', 'Piernas'),
('Hip Thrust (Empuje de Cadera)', 'Con la espalda alta apoyada en un banco y una barra sobre la cadera, se realiza una potente extensión de cadera. El mejor ejercicio para el desarrollo máximo de los glúteos.', 'Piernas'),
('Extensiones de Cuádriceps', 'Ejercicio de aislamiento en máquina para la parte frontal del muslo. Ideal para calentar las rodillas o para agotar el músculo al final de la rutina.', 'Piernas'),
('Curl de Isquiotibiales', 'Flexión de rodilla contra resistencia en máquina (puede ser tumbado o sentado). Aísla completamente la parte posterior del muslo.', 'Piernas'),

-- Hombros
('Press Arnold', 'Variante del press de hombros con mancuernas inventada por Arnold Schwarzenegger. Se rotan las muñecas durante el recorrido, involucrando intensamente la cabeza frontal y lateral.', 'Hombros'),
('Face Pull', 'Tracción con cuerda hacia la cara utilizando una polea alta. Fundamental para la postura y la salud del hombro, trabajando el deltoides posterior y los rotadores externos.', 'Hombros'),
('Elevaciones Frontales', 'Levantamiento de mancuernas, disco o barra recta hacia el frente. Aísla específicamente la parte anterior del hombro.', 'Hombros'),

-- Brazos
('Press Francés (Rompecráneos)', 'Extensión de tríceps acostado en un banco utilizando una barra EZ, llevando el peso hacia la frente o detrás de la cabeza. Trabaja la cabeza larga del tríceps.', 'Brazos'),
('Curl Predicador (Banco Scott)', 'Flexión de bíceps con los brazos apoyados en un pupitre inclinado. Evita hacer trampa balanceando el cuerpo y aísla el bíceps de forma estricta.', 'Brazos'),
('Patada de Tríceps', 'Con el torso inclinado hacia adelante, se extiende el brazo hacia atrás sujetando una mancuerna. Muy bueno para lograr la máxima contracción final del músculo.', 'Brazos'),

-- Core / Abdomen
('Rueda Abdominal (Ab Wheel)', 'Extensión completa del cuerpo rodando sobre una rueda desde la posición de rodillas. Requiere muchísima fuerza en el core para evitar quebrar la zona lumbar.', 'Core'),
('Mountain Climbers (Escaladores)', 'En posición de plancha o de flexión, se llevan las rodillas alternativamente hacia el pecho a un ritmo rápido. Combina trabajo de core y resistencia cardiovascular.', 'Core'),

-- Full Body / Acondicionamiento
('Burpees', 'Ejercicio metabólico completo que combina una sentadilla, una flexión de pecho y un salto vertical. Excelente para quemar calorías y ganar resistencia.', 'Full Body'),
('Kettlebell Swing', 'Balanceo de pesa rusa impulsado desde la cadera. Un movimiento explosivo que trabaja toda la cadena posterior (glúteos, isquios, espalda baja) y dispara la frecuencia cardíaca.', 'Full Body'),

-- ------------------------
-- SEGUNDA PARTE DE TU LISTA
-- ------------------------
-- Pecho
('Press de Banca', 'Ejercicio compuesto clásico para el pecho utilizando una barra olímpica en un banco plano. Trabaja pectorales, deltoides frontales y tríceps.', 'Pecho'),
('Press Inclinado con Mancuernas', 'Variante del press tradicional que pone mayor énfasis en la porción superior del pecho (haz clavicular).', 'Pecho'),
('Flexiones (Push-ups)', 'Ejercicio de peso corporal fundamental. Mantener el core contraído y bajar hasta que el pecho casi toque el suelo.', 'Pecho'),
('Cruces en Polea', 'Ejercicio de aislamiento para dar amplitud y forma al pectoral, manteniendo una tensión constante mediante el uso de poleas.', 'Pecho'),

-- Espalda
('Dominadas (Pull-ups)', 'Ejercicio de tracción vertical con peso corporal. Excelente para desarrollar la amplitud del dorsal ancho.', 'Espalda'),
('Peso Muerto', 'Ejercicio compuesto de potencia que trabaja toda la cadena posterior: espalda baja, glúteos e isquiotibiales.', 'Espalda'),
('Remo con Barra', 'Tracción horizontal inclinando el torso hacia adelante. Construye densidad en la espalda media y alta.', 'Espalda'),
('Jalón al Pecho', 'Alternativa en máquina a las dominadas. Consiste en tirar de una barra conectada a una polea alta hacia la parte superior del pecho.', 'Espalda'),

-- Piernas
('Sentadillas (Squats)', 'El ejercicio rey para el tren inferior. Flexión profunda de rodillas y cadera con una barra sobre los trapecios.', 'Piernas'),
('Prensa de Piernas', 'Máquina que permite empujar cargas pesadas con las piernas con la espalda apoyada, reduciendo la carga en la zona lumbar.', 'Piernas'),
('Zancadas (Lunges)', 'Ejercicio unilateral que implica dar un paso adelante y flexionar ambas rodillas a 90 grados. Mejora el equilibrio y fortalece glúteos y cuádriceps.', 'Piernas'),
('Peso Muerto Rumano', 'Variante del peso muerto con piernas semi-rígidas, enfocada en estirar y contraer los isquiotibiales y glúteos.', 'Piernas'),
('Elevación de Gemelos de Pie', 'Ejercicio de aislamiento para las pantorrillas. Consiste en una flexión plantar contra resistencia.', 'Piernas'),

-- Hombros
('Press Militar', 'Empuje vertical por encima de la cabeza, de pie o sentado. Trabaja de forma integral los hombros y requiere gran estabilización del core.', 'Hombros'),
('Elevaciones Laterales', 'Elevación de mancuernas hacia los lados hasta la altura de los hombros. Aísla la cabeza lateral del deltoides.', 'Hombros'),
('Pájaros (Elevaciones Posteriores)', 'Se realiza con el tronco inclinado hacia adelante. Enfocado en la cabeza posterior de los hombros y músculos romboides.', 'Hombros'),

-- Brazos
('Curl de Bíceps con Barra', 'Flexión de codos de pie sujetando una barra recta o barra EZ. El ejercicio constructor de masa por excelencia para bíceps.', 'Brazos'),
('Curl Martillo', 'Flexión de codo con agarre neutro (las palmas se miran). Trabaja el bíceps braquial y el braquiorradial (antebrazo).', 'Brazos'),
('Extensión de Tríceps en Polea', 'Empuje hacia abajo utilizando una polea alta con cuerda o barra recta para aislar el tríceps.', 'Brazos'),
('Fondos en Paralelas (Dips)', 'Ejercicio de empuje con peso corporal colgado en barras paralelas. Gran constructor de tríceps y porción inferior del pecho.', 'Brazos'),

-- Core / Abdomen
('Plancha Abdominal (Plank)', 'Ejercicio isométrico en el que se mantiene el cuerpo recto apoyado sobre los antebrazos y las puntas de los pies.', 'Core'),
('Crunch Abdominal', 'Flexión de la columna sobre el suelo para contraer el recto abdominal. Rango de movimiento corto y controlado.', 'Core'),
('Elevación de Piernas Colgado', 'Suspendido de una barra de dominadas, se elevan las piernas rectas o flexionadas hacia el pecho. Gran estímulo para la parte inferior del abdomen.', 'Core'),
('Giro Ruso (Russian Twist)', 'Ejercicio sentado en el suelo, con el torso reclinado, girando el tronco de lado a lado. Trabaja intensamente los oblicuos.', 'Core');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
