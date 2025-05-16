#!/bin/bash

# Данные для подключения к серверу
SERVER_USER="root"
SERVER_HOST="167.172.160.46"
SERVER_PATH="/var/www/html"
SERVER_PASSWORD="gQ8TjiwjFwUm6Rz"

# Сборка проекта
echo "Сборка проекта..."
npm run build

# Архивация проекта
echo "Архивация проекта..."
tar --exclude="node_modules" --exclude=".git" --exclude=".next/cache" -czvf deploy-project.tar.gz .

# Копирование на сервер
echo "Отправка на сервер..."
scp -o StrictHostKeyChecking=no deploy-project.tar.gz $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Выполнение команд на сервере
echo "Распаковка и перезапуск на сервере..."
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && tar -xzvf deploy-project.tar.gz && npm install && pm2 restart all || pm2 start npm --name \"makepay\" -- start"

# Удаление временных файлов
echo "Удаление временных файлов..."
rm deploy-project.tar.gz

echo "Деплой завершен!"
