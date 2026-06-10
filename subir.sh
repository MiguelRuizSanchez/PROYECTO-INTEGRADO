#!/bin/bash
set -e

echo "---- Actualizando Debian ----"
sudo apt update && sudo apt upgrade -y

if ! command -v docker &> /dev/null; then
    echo "---- Instalando Docker ---- "
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
fi

echo "---- Limpiando versiones anteriores ----"

sudo docker stop fitstation_web fitstation_api fitstation_db 2>/dev/null || true
sudo docker rm fitstation_web fitstation_api fitstation_db 2>/dev/null || true
sudo docker network rm fitstation_net 2>/dev/null || true

echo "---- Creando Red Interna ----"
sudo docker network create fitstation_net

echo "---- Levantando Base de Datos (MariaDB) ----"

sudo docker run -d \
  --name fitstation_db \
  --network fitstation_net \
  --restart always \
  -e MYSQL_ROOT_PASSWORD=123 \
  -e MYSQL_DATABASE=fitstation \
  -p 3306:3306 \
  -v $(pwd)/fitstation.sql:/docker-entrypoint-initdb.d/init.sql \
  mariadb:11.4

echo "---- Construyendo y Levantando API (.NET) ----"

sudo docker build -t imagen_api ./fitstation_backend/fitstation_backend
sudo docker run -d \
  --name fitstation_api \
  --network fitstation_net \
  --restart always \
  -e ConnectionStrings__DefaultConnection="Server=fitstation_db;Database=fitstation;User=root;Password=123;" \
  -e ASPNETCORE_HTTP_PORTS=5000 \
  -p 5000:5000 \
  imagen_api

echo "---- Construyendo y Levantando Web (Frontend) ----"
sudo docker build -t imagen_web ./fitstation_fontend
sudo docker run -d \
  --name fitstation_web \
  --network fitstation_net \
  --restart always \
  -p 80:80 \
  imagen_web

echo "---- ¡Listo! ---- "

IP=$(hostname -I | awk '{print $1}')
echo "Web (Angular): http://$IP"
echo "API (.NET):    http://$IP:5000"
EOF
