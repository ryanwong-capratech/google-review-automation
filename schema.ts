import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Google accounts used for posting reviews.
 */
export const googleAccounts = mysqlTable("google_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  password: text("password").notNull(),
  backupCodes: json("backupCodes").$type<string[]>(),
  displayName: varchar("displayName", { length: 255 }),
  status: mysqlEnum("status", ["available", "in_use", "invalid", "cooldown"]).default("available").notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleAccount = typeof googleAccounts.$inferSelect;
export type InsertGoogleAccount = typeof googleAccounts.$inferInsert;

/**
 * Target businesses on Google Maps.
 */
export const businesses = mysqlTable("businesses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  industry: varchar("industry", { length: 100 }).default("general"),
  googleMapsLink: text("googleMapsLink"),
  placeId: varchar("placeId", { length: 255 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;

/**
 * Review templates with positive/negative types.
 */
export const reviewTemplates = mysqlTable("review_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["positive", "negative"]).default("positive").notNull(),
  starRating: int("starRating").default(5).notNull(),
  language: varchar("language", { length: 10 }).default("zh-HK"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewTemplate = typeof reviewTemplates.$inferSelect;
export type InsertReviewTemplate = typeof reviewTemplates.$inferInsert;

/**
 * Review tasks linking accounts, businesses, and templates.
 */
export const reviewTasks = mysqlTable("review_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId").notNull(),
  businessId: int("businessId").notNull(),
  templateId: int("templateId"),
  reviewContent: text("reviewContent"),
  starRating: int("starRating").default(5).notNull(),
  reviewType: mysqlEnum("reviewType", ["positive", "negative"]).default("positive").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed", "cancelled", "paused"]).default("pending").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  errorMessage: text("errorMessage"),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewTask = typeof reviewTasks.$inferSelect;
export type InsertReviewTask = typeof reviewTasks.$inferInsert;

/**
 * Detailed execution logs for each task attempt.
 */
export const executionLogs = mysqlTable("execution_logs", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  accountEmail: varchar("accountEmail", { length: 320 }),
  businessName: varchar("businessName", { length: 500 }),
  reviewContent: text("reviewContent"),
  starRating: int("starRating"),
  status: mysqlEnum("status", ["success", "failed", "skipped"]).notNull(),
  errorMessage: text("errorMessage"),
  stepReached: varchar("stepReached", { length: 100 }),
  executionTimeMs: int("executionTimeMs"),
  screenshotUrl: text("screenshotUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = typeof executionLogs.$inferInsert;

/**
 * Scheduling configuration for automated task execution.
 */
export const scheduleConfigs = mysqlTable("schedule_configs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  executionTime: varchar("executionTime", { length: 5 }).default("10:00"),
  maxTasksPerDay: int("maxTasksPerDay").default(5).notNull(),
  minDelayMinutes: int("minDelayMinutes").default(30).notNull(),
  maxDelayMinutes: int("maxDelayMinutes").default(120).notNull(),
  timezone: varchar("timezone", { length: 50 }).default("Asia/Hong_Kong"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduleConfig = typeof scheduleConfigs.$inferSelect;
export type InsertScheduleConfig = typeof scheduleConfigs.$inferInsert;
