import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  googleAccounts, InsertGoogleAccount, GoogleAccount,
  businesses, InsertBusiness, Business,
  reviewTemplates, InsertReviewTemplate, ReviewTemplate,
  reviewTasks, InsertReviewTask, ReviewTask,
  executionLogs, InsertExecutionLog, ExecutionLog,
  scheduleConfigs, InsertScheduleConfig, ScheduleConfig,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== GOOGLE ACCOUNTS ====================
export async function listGoogleAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(googleAccounts).where(eq(googleAccounts.userId, userId)).orderBy(desc(googleAccounts.createdAt));
}

export async function getGoogleAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(googleAccounts).where(and(eq(googleAccounts.id, id), eq(googleAccounts.userId, userId))).limit(1);
  return result[0];
}

export async function createGoogleAccount(data: InsertGoogleAccount) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(googleAccounts).values(data);
  return result[0].insertId;
}

export async function updateGoogleAccount(id: number, userId: number, data: Partial<InsertGoogleAccount>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(googleAccounts).set(data).where(and(eq(googleAccounts.id, id), eq(googleAccounts.userId, userId)));
}

export async function deleteGoogleAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(googleAccounts).where(and(eq(googleAccounts.id, id), eq(googleAccounts.userId, userId)));
}

export async function batchCreateGoogleAccounts(dataList: InsertGoogleAccount[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataList.length === 0) return;
  await db.insert(googleAccounts).values(dataList);
}

// ==================== BUSINESSES ====================
export async function listBusinesses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(businesses).where(eq(businesses.userId, userId)).orderBy(desc(businesses.createdAt));
}

export async function getBusiness(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(businesses).where(and(eq(businesses.id, id), eq(businesses.userId, userId))).limit(1);
  return result[0];
}

export async function createBusiness(data: InsertBusiness) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(businesses).values(data);
  return result[0].insertId;
}

export async function updateBusiness(id: number, userId: number, data: Partial<InsertBusiness>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(businesses).set(data).where(and(eq(businesses.id, id), eq(businesses.userId, userId)));
}

export async function deleteBusiness(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(businesses).where(and(eq(businesses.id, id), eq(businesses.userId, userId)));
}

// ==================== REVIEW TEMPLATES ====================
export async function listReviewTemplates(userId: number, type?: "positive" | "negative") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(reviewTemplates.userId, userId)];
  if (type) conditions.push(eq(reviewTemplates.type, type));
  return db.select().from(reviewTemplates).where(and(...conditions)).orderBy(desc(reviewTemplates.createdAt));
}

export async function getReviewTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviewTemplates).where(and(eq(reviewTemplates.id, id), eq(reviewTemplates.userId, userId))).limit(1);
  return result[0];
}

export async function createReviewTemplate(data: InsertReviewTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviewTemplates).values(data);
  return result[0].insertId;
}

export async function updateReviewTemplate(id: number, userId: number, data: Partial<InsertReviewTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviewTemplates).set(data).where(and(eq(reviewTemplates.id, id), eq(reviewTemplates.userId, userId)));
}

export async function deleteReviewTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviewTemplates).where(and(eq(reviewTemplates.id, id), eq(reviewTemplates.userId, userId)));
}

export async function getActiveTemplatesByType(userId: number, type: "positive" | "negative") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviewTemplates).where(
    and(eq(reviewTemplates.userId, userId), eq(reviewTemplates.type, type), eq(reviewTemplates.isActive, true))
  );
}

// ==================== REVIEW TASKS ====================
export async function listReviewTasks(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(reviewTasks.userId, userId)];
  if (status) conditions.push(eq(reviewTasks.status, status as any));
  return db.select().from(reviewTasks).where(and(...conditions)).orderBy(desc(reviewTasks.createdAt));
}

export async function getReviewTask(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviewTasks).where(and(eq(reviewTasks.id, id), eq(reviewTasks.userId, userId))).limit(1);
  return result[0];
}

export async function createReviewTask(data: InsertReviewTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviewTasks).values(data);
  return result[0].insertId;
}

export async function batchCreateReviewTasks(dataList: InsertReviewTask[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (dataList.length === 0) return;
  await db.insert(reviewTasks).values(dataList);
}

export async function updateReviewTask(id: number, data: Partial<InsertReviewTask>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviewTasks).set(data).where(eq(reviewTasks.id, id));
}

export async function getPendingTasks(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviewTasks).where(eq(reviewTasks.status, "pending")).orderBy(reviewTasks.scheduledAt).limit(limit);
}

// ==================== EXECUTION LOGS ====================
export async function listExecutionLogs(taskId?: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  if (taskId) {
    return db.select().from(executionLogs).where(eq(executionLogs.taskId, taskId)).orderBy(desc(executionLogs.createdAt)).limit(limit);
  }
  return db.select().from(executionLogs).orderBy(desc(executionLogs.createdAt)).limit(limit);
}

export async function createExecutionLog(data: InsertExecutionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(executionLogs).values(data);
  return result[0].insertId;
}

// ==================== SCHEDULE CONFIGS ====================
export async function getScheduleConfig(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scheduleConfigs).where(eq(scheduleConfigs.userId, userId)).limit(1);
  return result[0];
}

export async function upsertScheduleConfig(userId: number, data: Partial<InsertScheduleConfig>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getScheduleConfig(userId);
  if (existing) {
    await db.update(scheduleConfigs).set(data).where(eq(scheduleConfigs.userId, userId));
  } else {
    await db.insert(scheduleConfigs).values({ ...data, userId });
  }
}

// ==================== FULL TASK FETCH ====================
export async function getReviewTaskFull(taskId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select({
    id: reviewTasks.id,
    accountId: reviewTasks.accountId,
    businessId: reviewTasks.businessId,
    reviewContent: reviewTasks.reviewContent,
    starRating: reviewTasks.starRating,
    retryCount: reviewTasks.retryCount,
    maxRetries: reviewTasks.maxRetries,
    accountEmail: googleAccounts.email,
    accountPassword: googleAccounts.password,
    backupCodes: googleAccounts.backupCodes,
    businessName: businesses.name,
    businessLink: businesses.googleMapsLink,
  })
    .from(reviewTasks)
    .innerJoin(googleAccounts, eq(reviewTasks.accountId, googleAccounts.id))
    .innerJoin(businesses, eq(reviewTasks.businessId, businesses.id))
    .where(eq(reviewTasks.id, taskId))
    .limit(1);
  return result[0];
}

export async function updateGoogleAccountLastUsed(accountId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(googleAccounts).set({ lastUsedAt: new Date() }).where(eq(googleAccounts.id, accountId));
}

// ==================== DASHBOARD STATS ====================
export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalAccounts: 0, totalBusinesses: 0, pendingTasks: 0, inProgressTasks: 0, completedTasks: 0, failedTasks: 0 };

  const [accounts] = await db.select({ count: sql<number>`count(*)` }).from(googleAccounts).where(eq(googleAccounts.userId, userId));
  const [biz] = await db.select({ count: sql<number>`count(*)` }).from(businesses).where(eq(businesses.userId, userId));
  const [pending] = await db.select({ count: sql<number>`count(*)` }).from(reviewTasks).where(and(eq(reviewTasks.userId, userId), eq(reviewTasks.status, "pending")));
  const [inProgress] = await db.select({ count: sql<number>`count(*)` }).from(reviewTasks).where(and(eq(reviewTasks.userId, userId), eq(reviewTasks.status, "in_progress")));
  const [completed] = await db.select({ count: sql<number>`count(*)` }).from(reviewTasks).where(and(eq(reviewTasks.userId, userId), eq(reviewTasks.status, "completed")));
  const [failed] = await db.select({ count: sql<number>`count(*)` }).from(reviewTasks).where(and(eq(reviewTasks.userId, userId), eq(reviewTasks.status, "failed")));

  return {
    totalAccounts: accounts.count,
    totalBusinesses: biz.count,
    pendingTasks: pending.count,
    inProgressTasks: inProgress.count,
    completedTasks: completed.count,
    failedTasks: failed.count,
  };
}
