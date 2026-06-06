1. NOMBRE DEL PROYECTO
   
FITSTATION - Aplicacion Web de Gestión de Gimnasios y Entrenamientos
--------------------------------------------------------------------------------------------
2. AUTORES DEL PROYECTO

Adrián González Vázquez (Responsable principal de Frontend - Angular)

Miguel Ruiz Sánchez (Responsable principal de Backend - .NET 9)

Ana Belén Alascio (Responsable principal de Base de Datos - MariaDB)

--------------------------------------------------------------------------------------------

Ciclo: 2º de ASIR (Administración de Sistemas Informáticos en Red)

Centro: I.E.S. Miguel Romero Esteo (Málaga)

Curso: 2025/2026

--------------------------------------------------------------------------------------------

3. DESCRIPCIÓN DEL PROYECTO

FitStation es una plataforma web creada para digitalizar la gestión diaria de un gimnasio y optimizar la comunicación directa entre los entrenadores y sus clientes a través de un sistema centralizado de citas y chat en tiempo real.

La aplicación permite a los clientes solicitar planes de entrenamiento a monitores específicos,
rellenar cuestionarios de salud individuales, 
reservar plazas en clases colectivas 
y consultar sus rutinas semanales con series y repeticiones detalladas.
Por otro lado, ofrece a los entrenadores un panel de control avanzado para gestionar sus clientes asignados,
diseñar entrenamientos a medida mediante un catálogo de ejercicios y resolver dudas directamente por la mensajería interna.

--------------------------------------------------------------------------------------------

4. TECNOLOGÍAS UTILIZADAS

Frontend: Angular (TypeScript, HTML5, CSS3, Nginx para producción)

Backend: ASP.NET Core (.NET 9, C#)

Base de Datos: MariaDB (Gestionada con HeidiSQL, automatizada con Triggers)

Seguridad: Encriptación de credenciales con BCrypt y autenticación con Tokens JWT

Infraestructura: Servidor físico con Debian 12, contenedores Docker y automatización mediante Scripts de Bash

--------------------------------------------------------------------------------------------

5. MODELO E/R y RELACIONAL DE LA ACTUAL BD

YA HA SIDO PUESTA EN EL APARTADO DE LA MEMORIA.

--------------------------------------------------------------------------------------------

6. EXPLICACIÓN PASO A PASO DE COMO EJECUTAR EL PROYECTO EN LOCAL

Requisitos Previos
Necesitas tener instalado en tu máquina:

Servidor MariaDB / MySQL

.NET 9 SDK

Node.js y pnpm instalado globalmente.

  Paso 1: Configurar la Base de Datos
    
Abre tu gestor de bases de datos (como HeidiSQL) y conéctate a tu servidor local.

Crea una base de datos vacía llamada fitstation.
    
    Importa el archivo SQL definitivo que encontrarás en este repositorio en: /fitstation_database/fitstation.sql.

  Paso 2: Levantar el Servidor (Backend)
    
  Abre una terminal y navega hasta la carpeta del backend:
  
    cd fitstation_backend  

  Restaura los paquetes del proyecto y arranca la API

    dot dotnet restore
    dotnet run

  Paso 3: Levantar la Web (Frontend): 

  Abre otra terminal independiente y navega hasta la carpeta del frontend:

    cd fitstation_frontend

  Instala las dependencias del proyecto utilizando pnpm para evitar conflictos de paquetes:

    pnpm install

  Arranca el servidor de desarrollo de Angular:

    ng serve

  IMPORTANTE: Para que funcione el sistema de chat y comunicación en tiempo real, instala la librería de SignalR ejecutando:

    pnpm add @microsoft/signalr

  Abre tu navegador de internet y entra en: 
    
    http://localhost:4200

--------------------------------------------------------------------------------------------

7. TUTORIAL DE USO DE LA APLICACIÓN

YA HA SIDO EXPLICADA EN EL APARTADO DE LA MEMORIA.

--------------------------------------------------------------------------------------------

8. BIBLIOGRAFIA

Para el desarrollo de FitStation se han consultado las siguientes documentaciones oficiales, tutoriales y herramientas de desarrollo:

1. Documentación Oficial de Tecnologías

Angular Framework: (https://angular.dev)
ASP.NET Core y .NET 9: (https://learn.microsoft.com/dotnet)
Entity Framework Core: (https://learn.microsoft.com/ef/core)
MariaDB Server: (https://mariadb.com/kb)

2. Seguridad y Herramientas del Proyecto

HeidiSQL GUI: (https://www.heidisql.com)
JWT (JSON Web Tokens): (https://jwt.io)
BCrypt.Net: (https://github.com/BcryptNet/bcrypt.net)

3. Consultas y Resolución de Errores

Stack Overflow: (https://stackoverflow.com)

--------------------------------------------------------------------------------------------

9. URL DONDE SE ENCUENTRA DESPEGLADA LA APLICACION (FALTA SUBIR AL SERVER)

