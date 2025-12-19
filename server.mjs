import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const distPath = path.join(__dirname, "dist");

app.use((req, res, next) => {
    const apiOrigin = process.env.API_BASE_URL
    ? new URL(process.env.API_BASE_URL).origin
    : "http://localhost";

    res.setHeader(
    "Content-Security-Policy",
    [
        "default-src 'self'",
        "frame-src 'self'",
        "script-src 'self' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline'",
        `connect-src 'self' ${apiOrigin} ${process.env.WS_URL || ""}`,
        `img-src 'self' ${apiOrigin} blob: data:`,
        `media-src 'self' ${apiOrigin} blob: data:`
    ].join("; ")
    );
    next();
});

app.use(express.static(distPath));

app.get("/manifest.json", (req, res) => {
    res.type("application/manifest+json");
    res.sendFile(path.join(distPath, "manifest.json"));
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

app.listen(3000,"0.0.0.0", () => {
    dotenv.config();
    console.log(process.env.API_BASE_URL)
    console.log("Server started at http://localhost:3000");
});


