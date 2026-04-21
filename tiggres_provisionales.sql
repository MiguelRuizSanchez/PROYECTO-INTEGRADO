- Crear automáticamente cliente o worker:

DELIMITER $$

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'client' THEN
    INSERT INTO clients (id_user) VALUES (NEW.id_user);
  ELSEIF NEW.role = 'worker' THEN
    INSERT INTO workers (id_user) VALUES (NEW.id_user);
  END IF;
END$$

DELIMITER ;

- Evitar mensajes vacíos (doble seguridad):

DELIMITER $$

CREATE TRIGGER before_message_insert
BEFORE INSERT ON messages
FOR EACH ROW
BEGIN
  IF TRIM(NEW.message) = '' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'El mensaje no puede estar vacío';
  END IF;
END$$

DELIMITER ;

- Evitar reservas en el pasado:

DELIMITER $$

CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  IF NEW.booking_date < NOW() THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'No puedes reservar en el pasado';
  END IF;
END$$

DELIMITER ;

- Validar que booking tenga clase o servicio:

DELIMITER $$

CREATE TRIGGER before_booking_check
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
  IF (NEW.id_class IS NULL AND NEW.id_service IS NULL) OR
     (NEW.id_class IS NOT NULL AND NEW.id_service IS NOT NULL) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Debe elegir clase o servicio, pero no ambos ni ninguno';
  END IF;
END$$

DELIMITER ;

- Evitar duplicados en relaciones (worker_services):

DELIMITER $$

CREATE TRIGGER before_worker_service_insert
BEFORE INSERT ON worker_services
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM worker_services
    WHERE id_worker = NEW.id_worker AND id_service = NEW.id_service
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Este servicio ya está asignado a este trabajador';
  END IF;
END$$

DELIMITER ;

- Evitar duplicados en worker_classes: 

DELIMITER $$

CREATE TRIGGER before_worker_class_insert
BEFORE INSERT ON worker_classes
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM worker_classes
    WHERE id_worker = NEW.id_worker AND id_class = NEW.id_class
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Esta clase ya está asignada a este trabajador';
  END IF;
END$$

DELIMITER ;
