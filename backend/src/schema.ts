import { getDatabaseName, getPool } from "./db";

export async function ensureDatabaseExists() {
  const database = getDatabaseName();
  const masterPool = await getPool("master");
  const safeName = database;

  await masterPool.request().query(`
    IF DB_ID(N'${safeName}') IS NULL
    BEGIN
      CREATE DATABASE [${safeName}]
    END
  `);
}

export async function databaseExists() {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    return true;
  } catch (error) {
    const number = (error as { number?: number })?.number;
    const message = (error as Error)?.message ?? "";
    if (number === 4060 || message.includes("Cannot open database")) {
      return false;
    }
    throw error;
  }
}

export async function ensureUsersTableExists() {
  const pool = await getPool();

  await pool.request().query(`
    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Users (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Users_Email UNIQUE (Email)
      )
    END
  `);
}

export async function ensureDatabaseAndTable() {
  await ensureDatabaseExists();
  await ensureUsersTableExists();
}
