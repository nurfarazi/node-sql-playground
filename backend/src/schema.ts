import { getDatabaseName, getPool, sql } from "./db";

const learningPlatformTables = [
  "Users",
  "Categories",
  "Courses",
  "Lessons",
  "Enrollments",
  "LessonProgress",
  "CourseProgress",
  "UserActivityLogs",
  "CourseCompletions",
  "Certificates",
  "CourseReviews",
  "CourseRatings",
  "Instructors",
  "CourseInstructors",
  "Tags",
  "CourseTags",
  "Notifications",
  "Announcements",
  "AuditLogs"
] as const;

export type TableCount = {
  name: string;
  status: "ok" | "missing";
  count?: number;
};

export async function getLearningPlatformTableCounts() {
  const pool = await getPool();
  const tables: TableCount[] = [];

  for (const table of learningPlatformTables) {
    const existsResult = await pool
      .request()
      .input("tableName", sql.NVarChar, table)
      .query(
        "SELECT 1 AS ok FROM sys.tables WHERE name = @tableName AND schema_id = SCHEMA_ID('dbo')"
      );

    if (existsResult.recordset.length === 0) {
      tables.push({ name: table, status: "missing" });
      continue;
    }

    const safeName = table.replace(/]/g, "]]");
    const countResult = await pool
      .request()
      .query(`SELECT COUNT(*) AS count FROM dbo.[${safeName}]`);
    const count = Number(countResult.recordset[0]?.count ?? 0);

    tables.push({ name: table, status: "ok", count });
  }

  return { database: getDatabaseName(), tables };
}

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

export async function ensureLearningPlatformSchema() {
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
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT UQ_Users_Email UNIQUE (Email)
      )
    END

    IF OBJECT_ID('dbo.Categories', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Categories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Categories_Name UNIQUE (Name)
      )
    END

    IF OBJECT_ID('dbo.Courses', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Courses (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CategoryId INT NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Level NVARCHAR(50) NULL,
        Status NVARCHAR(40) NOT NULL DEFAULT 'draft',
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Courses_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.Categories(Id)
      )
    END

    IF OBJECT_ID('dbo.Lessons', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Lessons (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CourseId INT NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Content NVARCHAR(MAX) NULL,
        Position INT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        UpdatedAt DATETIME2 NULL,
        CONSTRAINT FK_Lessons_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id)
      )
    END

    IF OBJECT_ID('dbo.Enrollments', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Enrollments (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CourseId INT NOT NULL,
        EnrolledAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Enrollments_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Enrollments_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT UQ_Enrollments_UserCourse UNIQUE (UserId, CourseId)
      )
    END

    IF OBJECT_ID('dbo.LessonProgress', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.LessonProgress (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        LessonId INT NOT NULL,
        Status NVARCHAR(40) NOT NULL DEFAULT 'not_started',
        PercentComplete INT NOT NULL DEFAULT 0,
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_LessonProgress_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_LessonProgress_Lessons FOREIGN KEY (LessonId) REFERENCES dbo.Lessons(Id),
        CONSTRAINT UQ_LessonProgress_UserLesson UNIQUE (UserId, LessonId)
      )
    END

    IF OBJECT_ID('dbo.CourseProgress', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CourseProgress (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CourseId INT NOT NULL,
        PercentComplete INT NOT NULL DEFAULT 0,
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CourseProgress_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_CourseProgress_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT UQ_CourseProgress_UserCourse UNIQUE (UserId, CourseId)
      )
    END

    IF OBJECT_ID('dbo.UserActivityLogs', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.UserActivityLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Action NVARCHAR(120) NOT NULL,
        Metadata NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_UserActivityLogs_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
      )
    END

    IF OBJECT_ID('dbo.CourseCompletions', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CourseCompletions (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CourseId INT NOT NULL,
        CompletedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CourseCompletions_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_CourseCompletions_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT UQ_CourseCompletions_UserCourse UNIQUE (UserId, CourseId)
      )
    END

    IF OBJECT_ID('dbo.Certificates', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Certificates (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CourseId INT NOT NULL,
        CertificateCode NVARCHAR(120) NOT NULL,
        IssuedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Certificates_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Certificates_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT UQ_Certificates_Code UNIQUE (CertificateCode)
      )
    END

    IF OBJECT_ID('dbo.CourseReviews', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CourseReviews (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CourseId INT NOT NULL,
        ReviewText NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CourseReviews_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_CourseReviews_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT UQ_CourseReviews_UserCourse UNIQUE (UserId, CourseId)
      )
    END

    IF OBJECT_ID('dbo.CourseRatings', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CourseRatings (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        CourseId INT NOT NULL,
        Rating INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_CourseRatings_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_CourseRatings_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT UQ_CourseRatings_UserCourse UNIQUE (UserId, CourseId)
      )
    END

    IF OBJECT_ID('dbo.Instructors', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Instructors (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        Bio NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Instructors_Email UNIQUE (Email)
      )
    END

    IF OBJECT_ID('dbo.CourseInstructors', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CourseInstructors (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CourseId INT NOT NULL,
        InstructorId INT NOT NULL,
        CONSTRAINT FK_CourseInstructors_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT FK_CourseInstructors_Instructors FOREIGN KEY (InstructorId) REFERENCES dbo.Instructors(Id),
        CONSTRAINT UQ_CourseInstructors UNIQUE (CourseId, InstructorId)
      )
    END

    IF OBJECT_ID('dbo.Tags', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Tags (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(120) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_Tags_Name UNIQUE (Name)
      )
    END

    IF OBJECT_ID('dbo.CourseTags', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.CourseTags (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        CourseId INT NOT NULL,
        TagId INT NOT NULL,
        CONSTRAINT FK_CourseTags_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id),
        CONSTRAINT FK_CourseTags_Tags FOREIGN KEY (TagId) REFERENCES dbo.Tags(Id),
        CONSTRAINT UQ_CourseTags UNIQUE (CourseId, TagId)
      )
    END

    IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Notifications (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Title NVARCHAR(200) NOT NULL,
        Message NVARCHAR(MAX) NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
      )
    END

    IF OBJECT_ID('dbo.Announcements', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Announcements (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(200) NOT NULL,
        Message NVARCHAR(MAX) NULL,
        StartsAt DATETIME2 NULL,
        EndsAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      )
    END

    IF OBJECT_ID('dbo.AuditLogs', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.AuditLogs (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ActorId INT NULL,
        Action NVARCHAR(120) NOT NULL,
        EntityType NVARCHAR(120) NULL,
        EntityId INT NULL,
        Metadata NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (ActorId) REFERENCES dbo.Users(Id)
      )
    END
  `);
}

export async function ensureDatabaseAndTable() {
  await ensureDatabaseExists();
  await ensureUsersTableExists();
}
