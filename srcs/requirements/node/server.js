import Fastify from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import mysql from "mysql2/promise";

const app = Fastify({
	logger: true
});

const DB_HOST = process.env.DB_HOST || "mariadb";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_NAME = process.env.DB_NAME || "zodiac";
const DB_USER = process.env.DB_USER || "zodiac";
const DB_PASSWORD_FILE = process.env.DB_PASSWORD_FILE;

async function readSecretFile(filePath) {
	if (!filePath) return "";
	const fs = await import("node:fs/promises");
	return (await fs.readFile(filePath, "utf8")).trim();
}

let pool;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.register(fastifyStatic, {
	root: path.join(__dirname, "public"),
	prefix: "/" // serves /index.html, /app.js, /style.css
});

app.get("/api/health", async () => {
	if (pool) {
		const conn = await pool.getConnection();
		try {
			await conn.ping();
		} finally {
			conn.release();
		}
	}
	return { ok: true };
});

app.get("/api/db-info", async () => {
	if (!pool) return { ok: false, error: "DB not configured" };
	const [rows] = await pool.query("SELECT DATABASE() AS db, NOW() AS now")
	return { ok: true, ...rows[0] };
});

async function start() {
	const dbPassword = await readSecretFile(DB_PASSWORD_FILE);

	if (dbPassword) {
		pool = mysql.createPool({
			host: DB_HOST,
			port: DB_PORT,
			database: DB_NAME,
			user: DB_USER,
			password: dbPassword,
			waitForConnections: true,
			connectionLimit: 10
		});
		app.log.info("MySQL pool initialized");
	} else {
		app.log.warn("DB password not found: starting without DB pool");
	}

	const host = "0.0.0.0";
	const port = 3000;
	await app.listen({ host, port });
}

start().catch((err) => {
	app.log.error(err);
	process.exit(1);
});
