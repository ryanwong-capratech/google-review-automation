import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateReviewContent, getIndustryOptions } from "./reviewGenerator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== DASHBOARD ====================
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),
  }),

  // ==================== GOOGLE ACCOUNTS ====================
  accounts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listGoogleAccounts(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getGoogleAccount(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
      backupCodes: z.array(z.string()).optional(),
      displayName: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createGoogleAccount({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      email: z.string().email().optional(),
      password: z.string().min(1).optional(),
      backupCodes: z.array(z.string()).optional(),
      displayName: z.string().optional(),
      status: z.enum(["available", "in_use", "invalid", "cooldown"]).optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateGoogleAccount(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteGoogleAccount(input.id, ctx.user.id);
      return { success: true };
    }),
    batchImport: protectedProcedure.input(z.object({
      accounts: z.array(z.object({
        email: z.string().email(),
        password: z.string().min(1),
        backupCodes: z.array(z.string()).optional(),
        displayName: z.string().optional(),
      })),
    })).mutation(async ({ ctx, input }) => {
      const dataList = input.accounts.map(a => ({ ...a, userId: ctx.user.id }));
      await db.batchCreateGoogleAccounts(dataList);
      return { count: dataList.length };
    }),
  }),

  // ==================== BUSINESSES ====================
  businesses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.listBusinesses(ctx.user.id);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getBusiness(input.id, ctx.user.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string().min(1),
      industry: z.string().optional(),
      googleMapsLink: z.string().optional(),
      placeId: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const id = await db.createBusiness({ ...input, userId: ctx.user.id });
      return { id };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      industry: z.string().optional(),
      googleMapsLink: z.string().optional(),
      placeId: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateBusiness(id, ctx.user.id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await db.deleteBusiness(input.id, ctx.user.id);
      return { success: true };
    }),
    industries: publicProcedure.query(() => {
      return getIndustryOptions();
    }),
  }),

  // ==================== REVIEW TASKS ====================
  tasks: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listReviewTasks(ctx.user.id, input?.status);
    }),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      return db.getReviewTask(input.id, ctx.user.id);
    }),
    batchCreate: protectedProcedure.input(z.object({
      businessIds: z.array(z.number()),
      accountIds: z.array(z.number()),
      reviewType: z.enum(["positive", "negative"]),
      language: z.string().optional(),
      scheduledAt: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const tasks: any[] = [];

      for (const businessId of input.businessIds) {
        // Get business info for AI generation
        const business = await db.getBusiness(businessId, ctx.user.id);
        if (!business) continue;

        for (const accountId of input.accountIds) {
          // Generate unique review content using AI
          const { content, starRating } = await generateReviewContent({
            businessName: business.name,
            industry: business.industry || "general",
            reviewType: input.reviewType,
            language: input.language || "zh-HK",
          });

          tasks.push({
            userId: ctx.user.id,
            accountId,
            businessId,
            reviewContent: content,
            starRating,
            reviewType: input.reviewType,
            status: "pending" as const,
            scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          });
        }
      }

      if (tasks.length === 0) {
        throw new Error("No valid business/account combinations found.");
      }

      await db.batchCreateReviewTasks(tasks);
      return { count: tasks.length };
    }),
    // Preview generated review content before creating tasks
    previewReview: protectedProcedure.input(z.object({
      businessId: z.number(),
      reviewType: z.enum(["positive", "negative"]),
      language: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const business = await db.getBusiness(input.businessId, ctx.user.id);
      if (!business) throw new Error("Business not found");

      const { content, starRating } = await generateReviewContent({
        businessName: business.name,
        industry: business.industry || "general",
        reviewType: input.reviewType,
        language: input.language || "zh-HK",
      });

      return { content, starRating, businessName: business.name };
    }),
    trigger: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const task = await db.getReviewTask(input.id, ctx.user.id);
      if (!task) throw new Error("Task not found");
      if (task.status !== "pending" && task.status !== "paused" && task.status !== "failed") {
        throw new Error(`Cannot trigger task with status: ${task.status}`);
      }
      // Execute the task immediately
      const { processTask } = await import("./reviewEngine");
      const result = await processTask(input.id);
      return { success: result.success, stepReached: result.stepReached, errorMessage: result.errorMessage };
    }),
    pause: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const task = await db.getReviewTask(input.id, ctx.user.id);
      if (!task) throw new Error("Task not found");
      await db.updateReviewTask(input.id, { status: "paused" });
      return { success: true };
    }),
    cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const task = await db.getReviewTask(input.id, ctx.user.id);
      if (!task) throw new Error("Task not found");
      await db.updateReviewTask(input.id, { status: "cancelled" });
      return { success: true };
    }),
  }),

  // ==================== EXECUTION LOGS ====================
  logs: router({
    list: protectedProcedure.input(z.object({
      taskId: z.number().optional(),
      limit: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      return db.listExecutionLogs(input?.taskId, input?.limit);
    }),
  }),

  // ==================== SCHEDULE CONFIG ====================
  schedule: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getScheduleConfig(ctx.user.id);
    }),
    update: protectedProcedure.input(z.object({
      isEnabled: z.boolean().optional(),
      executionTime: z.string().optional(),
      maxTasksPerDay: z.number().min(1).max(50).optional(),
      minDelayMinutes: z.number().min(5).max(360).optional(),
      maxDelayMinutes: z.number().min(10).max(720).optional(),
      timezone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertScheduleConfig(ctx.user.id, input);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
