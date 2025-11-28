import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();
const PORT = 4000;

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST", "DELETE", "PUT"],
  credentials: true,
}));

app.use(express.json());

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "romnapavlovsk0808@gmail.com" && password === "12345678") {
    res.json({ code: 200, message: "Успешный вход" });
  } else {
    res.status(401).json({ code: 401, message: "Неверный email или пароль" });
  }
});

app.get("/api/auth/isloggedin", (req, res) => {
  res.json({ userId: 1, code: 200, "isloggedin": true });
});

app.get("/api/posts", (req, res) => {
    const {limit, page} = req.query;
    res.json({
        code: 200,
        posts: [{
            id: 1,
            text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
            likes: 12,
            reposts: 12,
            comments: 12,
            groupName: "Fast Food Music",
            communityAvatar: "/public/testData/groupim.jpg",
            photos: ["/public/testData/1.jpg", "/public/testData/2.jpg"],
            authorID: 1,
        },
        {
            id: 2,
            text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
            likes: 14,
            reposts: 15,
            comments: 16,
            groupName: "Fast Food Music",
            communityAvatar: "/public/testData/groupim.jpg",
            photos: ["/public/testData/3.jpg", "/public/testData/4.jpg"],
            authorID: 1,
        },
                {
            id: 3,
            text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
            likes: 14,
            reposts: 15,
            comments: 16,
            groupName: "Fast Food Music",
            communityAvatar: "/public/testData/groupim.jpg",
            photos: [ "/public/testData/5.jpg", "/public/testData/6.jpg"],
            authorID: 2,
        }
        ]
    });
});

app.get('/api/friends/:id/count', (req, res) => {
    const userId = req.params.id;
    const { count } = req.query;

    const response = {
        count_friends: 12,
        count_followers: 34,
        count_follows: 56
    };

    res.json(response);
});

app.get("/api/chats", (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const allChats = [
        {
            id: 1,
            name: "Павловский Роман",
            avatarPath: "/public/testData/Avatar.jpg",
            isGroup: false,
            lastMessage: {
                id: 101,
                chatID: 1,
                authorID: 1,
                text: "Привет!",
                createdAt: "2025-10-21T12:34:56Z"
            },
            lastMessageAuthor: {
                userID: 1,
                fullName: "Павловский Роман",
                avatarPath: "/public/testData/Avatar.jpg"
            }
        },
        {
            id: 2,
            name: "Васютенко Роман",
            avatarPath: "/public/testData/Avatar.jpg",
            isGroup: false,
            lastMessage: {
                id: 102,
                chatID: 2,
                authorID: 2,
                text: "Как дела?",
                createdAt: "2025-10-21T12:35:56Z"
            },
            lastMessageAuthor: {
                userID: 2,
                fullName: "Васютенко Роман",
                avatarPath: "/public/testData/Avatar.jpg"
            }
        },
        {
            id: 3,
            name: "Иванов Иван",
            avatarPath: "/public/testData/Avatar.jpg",
            isGroup: false,
            lastMessage: {
                id: 103,
                chatID: 3,
                authorID: 3,
                text: "Привет!",
                createdAt: "2025-10-21T12:36:56Z"
            },
            lastMessageAuthor: {
                userID: 3,
                fullName: "Иванов Иван",
                avatarPath: "/public/testData/Avatar.jpg"
            }
        }
    ];

    const chats = allChats.slice(offset, offset + limit);
    res.json(chats);
});

app.get("/api/chats/:id/messages", (req, res) => {
    const chatID = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const authors = {
        1: { userID: 1, fullName: "Павловский Роман", avatarPath: "/public/testData/Avatar.jpg" },
        2: { userID: 2, fullName: "Васютенко Роман", avatarPath: "/public/testData/Avatar.jpg" }
    };


    const allMessages = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        chatID,
        text: `Сообщение #${i + 1}`,
        authorID: i % 2 === 0 ? 1 : 2,
        createdAt: new Date(Date.now() - i * 60000).toISOString()
    }));

    const messages = allMessages.slice(offset, offset + limit);

    res.json({
        chatId: chatID,
        messages,
        authors
    });
});

app.post("/api/chats/:chatID/message", (req, res) => {
    const chatID = parseInt(req.params.chatID);
    const { message } = req.body;

    if (!message || typeof message.text !== "string") {
        return res.status(400).json({ code: 400, message: "Invalid request body" });
    }

    const newMessageID = Math.floor(Math.random() * 10000) + 1;

    res.json({
        messageID: newMessageID
    });
});

app.get("/api/chats/user/:id", (req, res) => {
    const userID = parseInt(req.params.id);
    const allChats = [
        { id: 1, userID: 1 },
        { id: 2, userID: 2 },
        { id: 3, userID: 3 }
    ];

    const chat = allChats.find(c => c.userID === userID);

    if (chat) {
        res.json({ chatID: chat.id });
    } else {
        const newChatID = Math.floor(Math.random() * 1000) + 10;
        res.json({ chatID: newChatID });
    }
});


app.get("/api/friends/:id/status", (req, res) => {
    res.json({ status: "accepted" });
});

app.post("/api/friends/:id", (req, res) => {
    res.json({
        code: 200,
        message: "Запрос успешно отправлен"
    });
});

app.get("/api/profile/:id", (req, res) => {
    const userId = Number(req.params.id);

    res.json({
        aboutMyself: "Ккакой то текст, с информацией о себе. Какой то текст, с информацией о себе. Ккакой то текст, с информацией о себе. Какой то текст, с информацией о себе.",
        avatarPath: "/public/testData/Avatar.jpg",
        dob: "2000-08-08T00:00:00Z",
        firstName: "Роман",
        lastName: "Павловский",
        gender: "Мужской",
        headerPath: "/public/testData/Header.jpg",
        userID: userId
    });
});

app.get("/friends/requests", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
            success: false,
            message: "Неверные параметры пагинации"
        });
    }

    const totalRequests = 55;
    const requests = [];

    const start = (page - 1) * limit;
    const end = Math.min(start + limit, totalRequests);

    for (let i = start + 1; i <= end; i++) {
        requests.push({
            userID: i,
            firstName: `Имя${i}`,
            lastName: `Фамилия${i}`,
            avatarPath: `/public/testData/Avatar.jpg`,
            mutualFriendsCount: Math.floor(Math.random() * 10)
        });
    }

    res.json({
        success: true,
        page: page,
        limit: limit,
        total: totalRequests,
        requests: requests
    });
});

app.get("/friends", (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
            success: false,
            message: "Неверные параметры пагинации"
        });
    }

    const totalFriends = 95;
    const totalPages = Math.ceil(totalFriends / limit);
    const hasNext = page < totalPages;

    const start = (page - 1) * limit;
    const end = Math.min(start + limit, totalFriends);

    const friends = [];
    for (let i = start + 1; i <= end; i++) {
        friends.push({
            userID: i,
            fullName: `Друг ${i} Фамилия${i}`,
            avatarPath: `/public/testData/Avatar.jpg`
        });
    }

    res.json({
        friends,
        hasNext,
        page,
        totalPages
    });
});

app.delete("/api/friends/:id", (req, res) => {
    res.json({
        code: 200,
        message: "Друг успешно удален"
    });
});

app.put("/api/friends/:id/accept", (req, res) => {
    res.json({
        code: 200,
        message: "Друг успешно добавлен"
    });
});

const upload = multer();

app.post("/posts", upload.array("photos"), (req, res) => {
    const text = req.body.text; 
    console.log("Создан пост с текстом:", text);

    if (req.files && req.files.length > 0) {
        console.log("Принято файлов:", req.files.length);
        req.files.forEach((file, index) => {
            console.log(`Файл #${index + 1}:`, file.originalname, file.mimetype, file.size, "байт");
        });
    } else {
        console.log("Файлы не были переданы");
    }

    res.json({
        code: 201,
        message: "Пост успешно создан",
        receivedText: text,
        receivedFiles: req.files.map(f => f.originalname)
    });
});

app.put("/posts/:id", upload.array("attachments"), (req, res) => {
    const { id } = req.params;
    const text = req.body.text;

    console.log("Обновление поста:", id, text);

    if (req.files && req.files.length > 0) {
        console.log(`Файлы получены: ${req.files.length}`);
        req.files.forEach((file, index) => {
            console.log(`Файл #${index + 1}:`, file.originalname);
        });
    } else {
        console.log("Файлы не были переданы");
    }

    res.json({
        code: 200,
        message: "Пост успешно обновлён",
        postId: id,
        updatedText: text,
        receivedFiles: req.files.map(f => f.originalname)
    });
});


app.delete("/api/posts/:id", (req, res) => {
  res.json({
    code: 200,
    massege: "OK",
  })
});

const profileUpload = multer();
app.put("/api/profile", profileUpload.single("avatar"), (req, res) => {
    try {
        const profileJson = req.body.profile;
        let profileData = {};

        if (profileJson) {
            profileData = JSON.parse(profileJson);
        }

        console.log("Обновление профиля:");
        console.log("Данные профиля:", profileData);

        if (req.file) {
            console.log("Загружен новый аватар:");
            console.log("Имя файла:", req.file.originalname);
            console.log("Тип:", req.file.mimetype);
            console.log("Размер:", req.file.size, "байт");
        } else {
            console.log("Новый аватар не был передан");
        }

        res.json({
            code: 200,
            message: "Профиль успешно обновлён",
            updatedProfile: profileData,
            avatar: req.file ? req.file.originalname : null
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Ошибка сервера"
        });
    }
});

let supportRequests = [
  {
    id: 1,
    number: 1,
    loginEmail: "user1@example.com",
    contactEmail: "user1@example.com",
    name: "Иван Иванов",
    topic: "Приложение зависает/тормозит",
    description: "После авторизации лента грузится очень долго.",
    status: "closed",
    createdAt: "2025-12-10T09:15:00Z",
  },
  {
    id: 2,
    number: 2,
    loginEmail: "user2@example.com",
    contactEmail: "user2@example.com",
    name: "Пётр Петров",
    topic: "Не работает чат",
    description: "Сообщения не отправляются более 5 минут.",
    status: "in_progress",
    createdAt: "2025-12-10T10:05:00Z",
  },
  {
    id: 3,
    number: 3,
    loginEmail: "user3@example.com",
    contactEmail: "user3@example.com",
    name: "Роман Павловский",
    topic: "Проблема со входом",
    description: "При входе получаю ошибку 500.",
    status: "canceled",
    createdAt: "2025-12-10T11:30:00Z",
  },
  {
    id: 1,
    number: 1,
    loginEmail: "user1@example.com",
    contactEmail: "user1@example.com",
    name: "Иван Иванов",
    topic: "Приложение зависает/тормозит",
    description: "После авторизации лента грузится очень долго.",
    status: "closed",
    createdAt: "2025-12-10T09:15:00Z",
  },
  {
    id: 2,
    number: 2,
    loginEmail: "user2@example.com",
    contactEmail: "user2@example.com",
    name: "Пётр Петров",
    topic: "Не работает чат",
    description: "Сообщения не отправляются более 5 минут.",
    status: "in_progress",
    createdAt: "2025-12-10T10:05:00Z",
  },
  {
    id: 3,
    number: 3,
    loginEmail: "user3@example.com",
    contactEmail: "user3@example.com",
    name: "Роман Павловский",
    topic: "Проблема со входом",
    description: "При входе получаю ошибку 500.",
    status: "canceled",
    createdAt: "2025-12-10T11:30:00Z",
  },
  {
    id: 1,
    number: 1,
    loginEmail: "user1@example.com",
    contactEmail: "user1@example.com",
    name: "Иван Иванов",
    topic: "Приложение зависает/тормозит",
    description: "После авторизации лента грузится очень долго.",
    status: "closed",
    createdAt: "2025-12-10T09:15:00Z",
  },
  {
    id: 2,
    number: 2,
    loginEmail: "user2@example.com",
    contactEmail: "user2@example.com",
    name: "Пётр Петров",
    topic: "Не работает чат",
    description: "Сообщения не отправляются более 5 минут.",
    status: "in_progress",
    createdAt: "2025-12-10T10:05:00Z",
  },
  {
    id: 3,
    number: 3,
    loginEmail: "user3@example.com",
    contactEmail: "user3@example.com",
    name: "Роман Павловский",
    topic: "Проблема со входом",
    description: "При входе получаю ошибку 500.",
    status: "canceled",
    createdAt: "2025-12-10T11:30:00Z",
  },
  {
    id: 1,
    number: 1,
    loginEmail: "user1@example.com",
    contactEmail: "user1@example.com",
    name: "Иван Иванов",
    topic: "Приложение зависает/тормозит",
    description: "После авторизации лента грузится очень долго.",
    status: "closed",
    createdAt: "2025-12-10T09:15:00Z",
  },
  {
    id: 2,
    number: 2,
    loginEmail: "user2@example.com",
    contactEmail: "user2@example.com",
    name: "Пётр Петров",
    topic: "Не работает чат",
    description: "Сообщения не отправляются более 5 минут.",
    status: "in_progress",
    createdAt: "2025-12-10T10:05:00Z",
  },
  {
    id: 3,
    number: 3,
    loginEmail: "user3@example.com",
    contactEmail: "user3@example.com",
    name: "Роман Павловский",
    topic: "Проблема со входом",
    description: "При входе получаю ошибку 500.",
    status: "canceled",
    createdAt: "2025-12-10T11:30:00Z",
  },{
    id: 1,
    number: 1,
    loginEmail: "user1@example.com",
    contactEmail: "user1@example.com",
    name: "Иван Иванов",
    topic: "Приложение зависает/тормозит",
    description: "После авторизации лента грузится очень долго.",
    status: "closed",
    createdAt: "2025-12-10T09:15:00Z",
  },
  {
    id: 2,
    number: 2,
    loginEmail: "user2@example.com",
    contactEmail: "user2@example.com",
    name: "Пётр Петров",
    topic: "Не работает чат",
    description: "Сообщения не отправляются более 5 минут.",
    status: "in_progress",
    createdAt: "2025-12-10T10:05:00Z",
  },
  {
    id: 3,
    number: 3,
    loginEmail: "user3@example.com",
    contactEmail: "user3@example.com",
    name: "Роман Павловский",
    topic: "Проблема со входом",
    description: "При входе получаю ошибку 500.",
    status: "canceled",
    createdAt: "2025-12-10T11:30:00Z",
  },{
    id: 1,
    number: 1,
    loginEmail: "user1@example.com",
    contactEmail: "user1@example.com",
    name: "Иван Иванов",
    topic: "Приложение зависает/тормозит",
    description: "После авторизации лента грузится очень долго.",
    status: "closed",
    createdAt: "2025-12-10T09:15:00Z",
  },
  {
    id: 2,
    number: 2,
    loginEmail: "user2@example.com",
    contactEmail: "user2@example.com",
    name: "Пётр Петров",
    topic: "Не работает чат",
    description: "Сообщения не отправляются более 5 минут.",
    status: "in_progress",
    createdAt: "2025-12-10T10:05:00Z",
  },
  {
    id: 3,
    number: 3,
    loginEmail: "user3@example.com",
    contactEmail: "user3@example.com",
    name: "Роман Павловский",
    topic: "Проблема со входом",
    description: "При входе получаю ошибку 500.",
    status: "canceled",
    createdAt: "2025-12-10T11:30:00Z",
  },
];

let nextSupportId = supportRequests.length + 1;

app.get("/api/support", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      code: 400,
      message: "Неверные параметры пагинации",
    });
  }

  const total = supportRequests.length;
  const totalPages = Math.ceil(total / limit);

  const start = (page - 1) * limit;
  const end = Math.min(start + limit, total);

  const items = supportRequests
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(start, end);

  res.json({
    items,
    page,
    limit,
    total,
    totalPages,
  });
});



app.listen(PORT, () => {
  console.log(`API сервер запущен на http://localhost:${PORT}`);
});
