# Используем Node.js 20
FROM node:20

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --production

# Копируем весь проект
COPY . .

# Указываем порт
EXPOSE 3000

# Запускаем сервер напрямую через Node.js
CMD ["node", "server.mjs"]
