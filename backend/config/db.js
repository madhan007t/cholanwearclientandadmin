import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import env from "./env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let memoryServer;

export async function connectDB() {
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
    console.error(
      "FATAL: MONGODB_URI is not set. See .env.example (or set USE_MEMORY_DB=true for local dev).",
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("[db] MongoDB connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
