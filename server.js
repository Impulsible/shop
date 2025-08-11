import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(morgan("dev"));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Simple API for products
app.get("/api/products", (req, res) => {
  const productsPath = path.join(__dirname, "data", "products.json");
  try {
    const raw = fs.readFileSync(productsPath, "utf-8");
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load products." });
  }
});

// Fallback to index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

