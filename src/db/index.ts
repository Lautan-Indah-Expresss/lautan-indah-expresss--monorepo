import { drizzle, MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const connectionUrl = process.env.DATABASE_URL || "mysql://root:@localhost:3306/lie-db";

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
  db: MySql2Database<typeof schema> | undefined;
};

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    uri: connectionUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = globalForDb.db ?? drizzle(pool, { schema, mode: "default" });

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}
