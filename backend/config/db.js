import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import env from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let memoryServer;

async function connect() {
  mongoose.set("strictQuery", true);
  let uri = env.mongoUri;

  if (!uri && env.useMemoryDb && !env.isProd) {
    // Development convenience: a real mongod binary, persisted on disk, no installation required.
    const devUri = process.env.MONGODB_URI || "";
    try {
      // Another dev process (e.g. the API while you run `npm run seed`) may already own it - reuse.
      await mongoose.connect(devUri, { serverSelectionTimeoutMS: 800 });
      console.log("[db] Reusing running dev MongoDB at", devUri);
      return;
    } catch {
      /* not running - start it below */
    }
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dbPath = path.resolve(__dirname, "..", ".mongo-data");
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: { dbPath, storageEngine: "wiredTiger", port: 27018 },
    });
    uri = memoryServer.getUri("cholanwear");
    console.log(
      "[db] Started local dev MongoDB (mongodb-memory-server) at",
      uri,
    );
  }

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. See .env.example (or set USE_MEMORY_DB=true for local dev).",
    );
  }

  // Fail fast with the real reason (bad URI, IP not allow-listed...) instead of a vague buffering timeout.
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log("[db] MongoDB connected");
}

let connecting = null;

/**
 * Idempotent: safe to call on every request. Serverless hosts (Vercel) import app.js directly and
 * never run server.js, so the app itself must make sure a connection exists; it is reused while
 * the function instance stays warm.
 */
export function connectDB() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    connecting = connect().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
