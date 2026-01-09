import sql from "mssql/msnodesqlv8";

const poolCache = new Map<string, sql.ConnectionPool>();

function getServerName() {
  const server = process.env.DB_SERVER;
  if (!server) {
    throw new Error("DB_SERVER is required");
  }

  const instance = process.env.DB_INSTANCE?.trim();
  if (instance) {
    return `${server}\\${instance}`;
  }

  return server;
}

export function getDatabaseName() {
  const database = process.env.DB_DATABASE;
  if (!database) {
    throw new Error("DB_DATABASE is required");
  }

  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error("DB_DATABASE must be alphanumeric/underscore only");
  }

  return database;
}

function buildConfig(database: string): sql.config {
  const odbcDriver = process.env.ODBC_DRIVER?.trim();
  if (odbcDriver) {
    return {
      driver: "msnodesqlv8",
      connectionString: `Driver={${odbcDriver}};Server=${getServerName()};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;`
    };
  }
  return {
    server: getServerName(),
    database,
    driver: "msnodesqlv8",
    options: {
      trustedConnection: true,
      trustServerCertificate: true
    }
  };
}

export async function getPool(database?: string) {
  const dbName = database ?? getDatabaseName();
  const cached = poolCache.get(dbName);
  if (cached) {
    return cached;
  }

  const pool = await new sql.ConnectionPool(buildConfig(dbName)).connect();
  poolCache.set(dbName, pool);
  return pool;
}

export { sql };
