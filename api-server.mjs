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
  res.json({ code: 200, "isloggedin": false});
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

app.listen(PORT, () => {
  console.log(`API сервер запущен на http://localhost:${PORT}`);
});
