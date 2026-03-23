import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getDashboardStats: vi.fn().mockResolvedValue({
    totalAccounts: 3,
    totalBusinesses: 2,
    pendingTasks: 10,
    inProgressTasks: 2,
    completedTasks: 8,
    failedTasks: 1,
  }),
  listGoogleAccounts: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, email: "test@gmail.com", password: "pass", status: "available", displayName: "Test", backupCodes: [], createdAt: new Date(), updatedAt: new Date() },
  ]),
  getGoogleAccount: vi.fn().mockResolvedValue({
    id: 1, userId: 1, email: "test@gmail.com", password: "pass", status: "available",
  }),
  createGoogleAccount: vi.fn().mockResolvedValue(1),
  updateGoogleAccount: vi.fn().mockResolvedValue(undefined),
  deleteGoogleAccount: vi.fn().mockResolvedValue(undefined),
  batchCreateGoogleAccounts: vi.fn().mockResolvedValue(undefined),
  listBusinesses: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, name: "Test Biz", industry: "beauty", googleMapsLink: "https://maps.google.com", createdAt: new Date(), updatedAt: new Date() },
  ]),
  getBusiness: vi.fn().mockResolvedValue({ id: 1, userId: 1, name: "Test Biz", industry: "beauty" }),
  createBusiness: vi.fn().mockResolvedValue(1),
  updateBusiness: vi.fn().mockResolvedValue(undefined),
  deleteBusiness: vi.fn().mockResolvedValue(undefined),
  listReviewTasks: vi.fn().mockResolvedValue([]),
  getReviewTask: vi.fn().mockResolvedValue({ id: 1, userId: 1, status: "pending", accountId: 1, businessId: 1, starRating: 5 }),
  batchCreateReviewTasks: vi.fn().mockResolvedValue(undefined),
  updateReviewTask: vi.fn().mockResolvedValue(undefined),
  getPendingTasks: vi.fn().mockResolvedValue([]),
  listExecutionLogs: vi.fn().mockResolvedValue([]),
  createExecutionLog: vi.fn().mockResolvedValue(1),
  getScheduleConfig: vi.fn().mockResolvedValue({
    isEnabled: false, executionTime: "10:00", maxTasksPerDay: 5,
    minDelayMinutes: 30, maxDelayMinutes: 120, timezone: "Asia/Hong_Kong",
  }),
  upsertScheduleConfig: vi.fn().mockResolvedValue(undefined),
  getReviewTaskFull: vi.fn().mockResolvedValue(undefined),
  updateGoogleAccountLastUsed: vi.fn().mockResolvedValue(undefined),
}));

// Mock reviewGenerator to avoid LLM calls in tests
vi.mock("./reviewGenerator", () => ({
  getIndustryOptions: vi.fn().mockReturnValue([
    { value: "beauty", label: "美容/護膚" },
    { value: "restaurant", label: "餐飲/餐廳" },
    { value: "dating", label: "配對/交友服務" },
    { value: "general", label: "一般商業" },
  ]),
  generateReviewContent: vi.fn().mockResolvedValue({
    content: "好好嘅服務，推薦俾大家！",
    starRating: 5,
  }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
  return { ctx };
}

describe("Auth", () => {
  it("clears the session cookie on logout", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("returns user when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result?.email).toBe("test@example.com");
  });

  it("returns null when not authenticated", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("Dashboard", () => {
  it("returns dashboard stats without templates", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const stats = await caller.dashboard.stats();
    expect(stats).toHaveProperty("totalAccounts");
    expect(stats).toHaveProperty("totalBusinesses");
    expect(stats).toHaveProperty("pendingTasks");
    expect(stats).toHaveProperty("inProgressTasks");
    expect(stats).toHaveProperty("completedTasks");
    expect(stats).toHaveProperty("failedTasks");
    // Should NOT have totalTemplates anymore
    expect(stats).not.toHaveProperty("totalTemplates");
    expect(stats.totalAccounts).toBe(3);
  });
});

describe("Accounts", () => {
  it("lists accounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const accounts = await caller.accounts.list();
    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBe(1);
    expect(accounts[0].email).toBe("test@gmail.com");
  });

  it("creates an account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accounts.create({
      email: "new@gmail.com",
      password: "pass123",
      displayName: "New Account",
    });
    expect(result).toHaveProperty("id");
  });

  it("deletes an account", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accounts.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("batch imports accounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.accounts.batchImport({
      accounts: [
        { email: "a@gmail.com", password: "pass1" },
        { email: "b@gmail.com", password: "pass2" },
      ],
    });
    expect(result.count).toBe(2);
  });
});

describe("Businesses", () => {
  it("lists businesses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const businesses = await caller.businesses.list();
    expect(Array.isArray(businesses)).toBe(true);
    expect(businesses.length).toBe(1);
    expect(businesses[0].name).toBe("Test Biz");
  });

  it("creates a business with industry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.businesses.create({
      name: "New Business",
      industry: "beauty",
      googleMapsLink: "https://maps.google.com/place/new",
    });
    expect(result).toHaveProperty("id");
  });

  it("returns industry options", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const industries = await caller.businesses.industries();
    expect(Array.isArray(industries)).toBe(true);
    expect(industries.length).toBeGreaterThan(0);
    expect(industries[0]).toHaveProperty("value");
    expect(industries[0]).toHaveProperty("label");
  });
});

describe("Tasks (AI-generated reviews)", () => {
  it("batch creates tasks with AI-generated content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.batchCreate({
      businessIds: [1],
      accountIds: [1],
      reviewType: "positive",
      language: "zh-HK",
    });
    expect(result.count).toBe(1);
  });

  it("previews AI-generated review content", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.previewReview({
      businessId: 1,
      reviewType: "positive",
      language: "zh-HK",
    });
    expect(result).toHaveProperty("content");
    expect(result).toHaveProperty("starRating");
    expect(result).toHaveProperty("businessName");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("lists tasks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const tasks = await caller.tasks.list();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it("cancels a task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.cancel({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("pauses a task", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.tasks.pause({ id: 1 });
    expect(result.success).toBe(true);
  });
});

describe("Logs", () => {
  it("lists execution logs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const logs = await caller.logs.list();
    expect(Array.isArray(logs)).toBe(true);
  });
});

describe("Schedule", () => {
  it("gets schedule config", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const config = await caller.schedule.get();
    expect(config).toHaveProperty("isEnabled");
    expect(config).toHaveProperty("executionTime");
    expect(config).toHaveProperty("maxTasksPerDay");
  });

  it("updates schedule config", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.schedule.update({
      isEnabled: true,
      executionTime: "09:00",
      maxTasksPerDay: 10,
    });
    expect(result.success).toBe(true);
  });
});

describe("Router structure", () => {
  it("has all expected routers", () => {
    const caller = appRouter.createCaller(createAuthContext().ctx);
    expect(caller.auth).toBeDefined();
    expect(caller.dashboard).toBeDefined();
    expect(caller.accounts).toBeDefined();
    expect(caller.businesses).toBeDefined();
    expect(caller.tasks).toBeDefined();
    expect(caller.logs).toBeDefined();
    expect(caller.schedule).toBeDefined();
  });

  it("does NOT have templates router", () => {
    // Check the router definition directly instead of the proxy caller
    const routerDef = appRouter._def.procedures as Record<string, unknown>;
    const hasTemplatesProcedure = Object.keys(routerDef).some(key => key.startsWith("templates."));
    expect(hasTemplatesProcedure).toBe(false);
  });
});
