import express from "express";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.engine("hbs", engine({ extname: ".hbs", defaultLayout: false }));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname));

app.use(express.static(path.join(__dirname)));

const posts = [
  { id: 1, text: "Первый пост", likes: 10, reposts: 2 },
  { id: 2, text: "Второй пост", likes: 3, reposts: 0 },
];

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/register", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("index");
});

app.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
