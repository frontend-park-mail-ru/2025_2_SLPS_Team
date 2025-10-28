import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET","POST"],
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
            photos: ["/public/testData/1.jpg", "/public/testData/2.jpg"]
        },
        {
            id: 2,
            text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
            likes: 14,
            reposts: 15,
            comments: 16,
            groupName: "Fast Food Music",
            communityAvatar: "/public/testData/groupim.jpg",
            photos: ["/public/testData/3.jpg", "/public/testData/4.jpg"]
        },
                {
            id: 3,
            text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
            likes: 14,
            reposts: 15,
            comments: 16,
            groupName: "Fast Food Music",
            communityAvatar: "/public/testData/groupim.jpg",
            photos: [ "/public/testData/5.jpg", "/public/testData/6.jpg"]
        }
        ]
    });
});

app.get("/api/user/:id", (req, res) => {
  const userId = req.params.id;

  const response = {
    User: {
      id: Number(userId),
      full_name: "Васютенко Роман",
      email: "roman@mail.com",
      phone: "123456789",
      avatar: "./public/testData/Avatar.jpg",
      gender: "Женский",
      header: null,
      about_myself: "Ккакой то текст, с информацией о себе. Какой то текст, с информацией о себе. Ккакой то текст, с информацией о себе. Какой то текст, с информацией о себе.",
      dob: "2000-08-08T00:00:00Z",
      created_at: "2024-02-01T10:22:11Z",
      updated_at: "2024-03-11T14:36:02Z"
    },
    is_owner: true,
    status: "ok"
  };

  res.json(response);
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
  const chats = [
    {
      id: 1,
      name: "Павловский Роман",
      avatar: "/public/testData/Avatar.jpg",
      LastMessage: {
        author_name: "Вы",
        text: "Какой то текст сообщения, какой то текст сообщения.",
        created_at: "2025-10-21T12:34:56Z"
      }
    },
    {
      id: 2,
      name: "Васютенко Роман",
      avatar: "/public/testData/Avatar.jpg",
      LastMessage: {
        author_name: "Вы",
        text: "Какой то текст сообщения, какой то текст сообщения.",
        created_at: "2025-10-21T12:34:56Z"
      }
    },
    {
      id: 3,
      name: "Павловский Роман",
      avatar: "/public/testData/Avatar.jpg",
      LastMessage: {
        author_name: "Вы",
        text: "Какой то текст сообщения, какой то текст сообщения.",
        created_at: "2025-10-21T12:34:56Z"
      }
    },
    {
      id: 4,
      name: "Васютенко Роман",
      avatar: "/public/testData/Avatar.jpg",
      LastMessage: {
        author_name: "Вы",
        text: "Какой то текст сообщения, какой то текст сообщения.",
        created_at: "2025-10-21T12:34:56Z"
      }
    },
    {
      id: 5,
      name: "Васютенко Роман",
      avatar: "/public/testData/Avatar.jpg",
      LastMessage: {
        author_name: "Вы",
        text: "Какой то текст сообщения, какой то текст сообщения.",
        created_at: "2025-10-21T12:34:56Z"
      }
    },
    {
      id: 6,
      name: "Павловский Роман",
      avatar: "/public/testData/Avatar.jpg",
      LastMessage: {
        author_name: "Вы",
        text: "Какой то текст сообщения, какой то текст сообщения.",
        created_at: "2025-10-21T12:34:56Z"
      }
    },
  ];

  res.json({
    code: 200,
    chats
  });
});


app.get("/api/chat/:id", (req, res) => {
  const { id } = req.params;

  const texts = [
    "Привет!",
    "Какой то текст",
    "текст",
    "Текст по длиннее",
    "Короче",
    "ФФФФФ",
    "какой то достаточно длинный текст",
    "Да",
    "Нет",
  ];

  const users = [
    { id: 1, full_name: "Павловский Роман", avatar: "/public/testData/Avatar.jpg" },
    { id: 2, full_name: "Васютенко Роман", avatar: "/public/testData/Avatar.jpg" }
  ];

  const messages = [];
  let currentUserIndex = 0;
  let i = 0;

  while (messages.length < 1000) {
    const seriesLength = Math.floor(Math.random() * 3) + 2;
    const user = users[currentUserIndex];

    for (let j = 0; j < seriesLength && messages.length < 1000; j++) {
      const text = texts[Math.floor(Math.random() * texts.length)];
      messages.push({
        id: i + 1,
        User: {
          id: user.id,
          full_name: user.full_name,
          avatar: user.avatar,
          updated_at: new Date().toISOString()
        },
        text,
        created_at: new Date(Date.now() - i * 60000).toISOString()
      });
      i++;
    }

    currentUserIndex = 1 - currentUserIndex;
  }

  res.json({
    code: 200,
    chatId: Number(id),
    messages
  });
});





app.listen(PORT, () => {
  console.log(`API сервер запущен на http://localhost:${PORT}`);
});
