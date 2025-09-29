import express from "express";
import {engine} from "express-handlebars";
import path from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.engine("hbs", engine({extname: ".hbs", defaultLayout: false}));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname));

app.use(express.static(path.join(__dirname)));

const distPath = path.join(__dirname, "");

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");

    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self'; object-src 'none';" +
    "connect-src 'self' http://localhost:8080;"
    );
    next()
});

app.get(/\/(.*)/, (req, res) => {
    res.render("index")
});

app.listen(3000, () => {
    console.log("Server started on http://localhost:3000");
});
