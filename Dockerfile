# Используем Node.js 20
FROM node:20

# Создаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходники
COPY . .

# Открываем порт (по необходимости)
EXPOSE 80

# Запускаем команду start
CMD ["npm", "start"]
