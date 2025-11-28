import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const distPath = path.join(__dirname, "dist");

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
  //  res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "frame-src 'self'; " + 
        "script-src 'self' https://cdn.jsdelivr.net; " +
        "style-src 'self'; object-src 'none'; " +
        `connect-src 'self' ${process.env.API_BASE_URL || 'http://185.86.146.77:8080'} ${process.env.WS_URL || ''}; ` +
        `img-src 'self' ${process.env.API_BASE_URL || 'http://185.86.146.77:8080'} blob: data:;`
    );
    next();
});

app.use(express.static(distPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

app.listen(80, () => {
    dotenv.config();
    console.log(process.env.API_BASE_URL)
    console.log("Server started at http://localhost:3000");
});


