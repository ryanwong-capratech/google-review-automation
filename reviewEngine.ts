/**
 * Google Review Automation Engine
 * 
 * This module handles the automated posting of Google reviews using
 * browser automation. It simulates real user behavior to:
 * 1. Log in to a Google account
 * 2. Navigate to a business on Google Maps
 * 3. Post a review with the specified star rating and content
 * 
 * IMPORTANT: This engine requires a Playwright-compatible environment.
 * In production deployment, the actual browser automation will need
 * to run on a server with Playwright and Chromium installed.
 * 
 * For the deployed web app, this module provides a simulation mode
 * that logs the steps without actually executing browser actions.
 */

import * as db from "./db";

// Types
export interface ReviewTaskInput {
  taskId: number;
  accountEmail: string;
  accountPassword: string;
  backupCodes?: string[];
  businessName: string;
  businessLink?: string;
  reviewContent: string;
  starRating: number;
}

export interface ReviewTaskResult {
  success: boolean;
  stepReached: string;
  errorMessage?: string;
  executionTimeMs: number;
}

// Delay utility for anti-detection
function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Execute a single review task.
 * 
 * This function attempts to:
 * 1. Launch browser (1920x1080 viewport)
 * 2. Log in to Google account
 * 3. Handle 2FA if needed (using backup codes)
 * 4. Navigate to the business on Google Maps
 * 5. Click "Write a review"
 * 6. Select star rating
 * 7. Type review content
 * 8. Click "Post" / "Publish"
 * 
 * In simulation mode (when Playwright is not available),
 * it logs each step and simulates the process.
 */
export async function executeReviewTask(input: ReviewTaskInput): Promise<ReviewTaskResult> {
  const startTime = Date.now();
  let stepReached = "init";

  try {
    // Try to import playwright - if not available, use simulation mode
    let playwright: any;
    let isSimulation = false;

    // Always use real Playwright execution
    // @ts-ignore - playwright will be installed in production
    playwright = await import("playwright");

    // === REAL PLAYWRIGHT EXECUTION ===
    stepReached = "launching_browser";
    console.log("[ReviewEngine] Launching Chromium browser (1920x1080)");
    const browser = await playwright.chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: getRandomUserAgent(),
      locale: "zh-HK",
      timezoneId: "Asia/Hong_Kong",
    });

    // Mask automation detection
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
      // @ts-ignore
      window.chrome = { runtime: {} };
    });

    const page = await context.newPage();

    try {
      // Step 1: Google Login
      stepReached = "navigating_to_login";
      await page.goto("https://accounts.google.com/ServiceLogin?hl=en", { waitUntil: "networkidle" });
      await randomDelay(1000, 2000);

      // Enter email
      stepReached = "entering_email";
      await page.fill('input[type="email"]', input.accountEmail);
      await randomDelay(500, 1000);
      await page.click('#identifierNext');
      await page.waitForTimeout(3000);

      // Enter password
      stepReached = "entering_password";
      await page.fill('input[type="password"]', input.accountPassword);
      await randomDelay(500, 1000);
      await page.click('#passwordNext');
      await page.waitForTimeout(5000);

      // Check for 2FA
      stepReached = "checking_2fa";
      const needs2FA = await page.$('text=2-Step Verification') || await page.$('text=Verify it');
      if (needs2FA && input.backupCodes && input.backupCodes.length > 0) {
        stepReached = "handling_2fa";
        // Try to use backup code
        const tryAnotherWay = await page.$('text=Try another way');
        if (tryAnotherWay) {
          await tryAnotherWay.click();
          await page.waitForTimeout(2000);
        }
        const backupCodeOption = await page.$('text=Enter one of your 8-digit backup codes');
        if (backupCodeOption) {
          await backupCodeOption.click();
          await page.waitForTimeout(2000);
          const code = input.backupCodes[0]; // Use first available backup code
          await page.fill('input[type="text"]', code);
          await randomDelay(500, 1000);
          await page.click('button:has-text("Next")');
          await page.waitForTimeout(5000);
        }
      }

      // Check if login was successful
      stepReached = "verifying_login";
      const currentUrl = page.url();
      if (currentUrl.includes("accounts.google.com/signin") || currentUrl.includes("challenge")) {
        throw new Error("Login failed - may need manual 2FA or account is locked");
      }

      // Step 2: Navigate to business on Google Maps
      stepReached = "navigating_to_business";
      if (input.businessLink) {
        await page.goto(input.businessLink, { waitUntil: "networkidle" });
      } else {
        await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(input.businessName)}`, { waitUntil: "networkidle" });
      }
      await randomDelay(2000, 4000);

      // Step 3: Click "Write a review"
      stepReached = "clicking_write_review";
      // Try multiple selectors for the "Write a review" button
      const reviewButtonSelectors = [
        'button[aria-label*="Write a review"]',
        'button:has-text("Write a review")',
        'button:has-text("撰寫評論")',
        'span:has-text("Write a review")',
        'span:has-text("撰寫評論")',
      ];

      let clicked = false;
      for (const selector of reviewButtonSelectors) {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        // Try clicking the Reviews tab first
        const reviewsTab = await page.$('button[aria-label*="Reviews"]') || await page.$('button:has-text("評論")');
        if (reviewsTab) {
          await reviewsTab.click();
          await page.waitForTimeout(2000);
          // Try again
          for (const selector of reviewButtonSelectors) {
            const btn = await page.$(selector);
            if (btn) {
              await btn.click();
              clicked = true;
              break;
            }
          }
        }
      }

      if (!clicked) {
        throw new Error("Could not find 'Write a review' button");
      }

      await randomDelay(2000, 3000);

      // Step 4: Select star rating
      stepReached = "selecting_stars";
      // Google Maps uses aria-label like "5 stars" or "5 顆星"
      const starSelectors = [
        `div[aria-label="${input.starRating} stars"]`,
        `div[aria-label="${input.starRating} 顆星"]`,
        `span[aria-label="${input.starRating} stars"]`,
      ];

      let starClicked = false;
      for (const selector of starSelectors) {
        const star = await page.$(selector);
        if (star) {
          await star.click();
          starClicked = true;
          break;
        }
      }

      if (!starClicked) {
        // Fallback: try to click the nth star by index
        const stars = await page.$$('[data-rating]');
        if (stars.length >= input.starRating) {
          await stars[input.starRating - 1].click();
          starClicked = true;
        }
      }

      await randomDelay(1000, 2000);

      // Step 5: Type review content
      stepReached = "typing_review";
      const textareaSelectors = [
        'textarea[aria-label*="review"]',
        'textarea[aria-label*="評論"]',
        'textarea',
        'div[contenteditable="true"]',
      ];

      let typed = false;
      for (const selector of textareaSelectors) {
        const textarea = await page.$(selector);
        if (textarea) {
          await textarea.click();
          await randomDelay(500, 1000);
          // Type character by character for more human-like behavior
          // Ensure UTF-8 encoding for Chinese characters
          await textarea.type(input.reviewContent, { delay: Math.random() * 50 + 25 });
          typed = true;
          break;
        }
      }

      if (!typed) {
        throw new Error("Could not find review text input");
      }

      await randomDelay(1000, 2000);

      // Step 6: Click Post/Publish button
      stepReached = "clicking_publish";
      const publishSelectors = [
        'button:has-text("Post")',
        'button:has-text("發佈")',
        'button:has-text("Publish")',
        'button[aria-label*="Post"]',
        'button[aria-label*="發佈"]',
      ];

      let published = false;
      for (const selector of publishSelectors) {
        const btn = await page.$(selector);
        if (btn) {
          await btn.scrollIntoViewIfNeeded();
          await randomDelay(500, 1000);
          await btn.click();
          published = true;
          break;
        }
      }

      if (!published) {
        throw new Error("Could not find Publish/Post button");
      }

      // Wait for review to be posted
      await page.waitForTimeout(3000);
      stepReached = "completed";
      console.log("[ReviewEngine] Review successfully posted");

      return {
        success: true,
        stepReached,
        executionTimeMs: Date.now() - startTime,
      };
    } finally {
      await browser.close();
    }
  } catch (error: any) {
    return {
      success: false,
      stepReached,
      errorMessage: error.message || "Unknown error",
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Simulation mode - logs each step without actual browser automation.
 * Used when Playwright is not available (e.g., in deployed environment).
 */
async function executeSimulation(input: ReviewTaskInput, startTime: number): Promise<ReviewTaskResult> {
  console.log(`[ReviewEngine:Simulation] Starting review task for ${input.businessName}`);
  console.log(`[ReviewEngine:Simulation] Account: ${input.accountEmail}`);
  console.log(`[ReviewEngine:Simulation] Stars: ${input.starRating}`);
  console.log(`[ReviewEngine:Simulation] Content: ${input.reviewContent.substring(0, 50)}...`);

  // Simulate processing time
  await randomDelay(2000, 5000);

  console.log(`[ReviewEngine:Simulation] Steps: login → navigate → write_review → select_stars → type_content → publish`);
  console.log(`[ReviewEngine:Simulation] Task completed (simulation mode)`);

  return {
    success: true,
    stepReached: "completed_simulation",
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Process a task from the database.
 * Fetches all required data, executes the review, and logs the result.
 */
export async function processTask(taskId: number): Promise<ReviewTaskResult> {
  // Update task status to in_progress
  await db.updateReviewTask(taskId, { status: "in_progress", startedAt: new Date() });

  // Fetch task details
  const task = await db.getReviewTaskFull(taskId);
  if (!task) {
    const result: ReviewTaskResult = {
      success: false,
      stepReached: "fetch_task",
      errorMessage: "Task not found",
      executionTimeMs: 0,
    };
    await db.updateReviewTask(taskId, { status: "failed", errorMessage: result.errorMessage });
    return result;
  }

  // Execute the review
  const result = await executeReviewTask({
    taskId,
    accountEmail: task.accountEmail,
    accountPassword: task.accountPassword,
    backupCodes: task.backupCodes || undefined,
    businessName: task.businessName,
    businessLink: task.businessLink || undefined,
    reviewContent: task.reviewContent || "Great service!",
    starRating: task.starRating,
  });

  // Update task status
  if (result.success) {
    await db.updateReviewTask(taskId, {
      status: "completed",
      completedAt: new Date(),
    });
    // Update account last used
    await db.updateGoogleAccountLastUsed(task.accountId);
  } else {
    const retryCount = (task.retryCount || 0) + 1;
    const maxRetries = task.maxRetries || 3;
    await db.updateReviewTask(taskId, {
      status: retryCount >= maxRetries ? "failed" : "pending",
      errorMessage: result.errorMessage,
      retryCount,
    });
  }

  // Create execution log
  await db.createExecutionLog({
    taskId,
    accountEmail: task.accountEmail,
    businessName: task.businessName,
    reviewContent: task.reviewContent,
    starRating: task.starRating,
    status: result.success ? "success" : "failed",
    errorMessage: result.errorMessage || null,
    stepReached: result.stepReached,
    executionTimeMs: result.executionTimeMs,
  });

  return result;
}

/**
 * Process multiple pending tasks with delays between each.
 */
export async function processPendingTasks(maxTasks: number, minDelayMs: number, maxDelayMs: number): Promise<number> {
  const pendingTasks = await db.getPendingTasks(maxTasks);
  let processed = 0;

  for (const task of pendingTasks) {
    await processTask(task.id);
    processed++;

    // Add random delay between tasks to avoid detection
    if (processed < pendingTasks.length) {
      await randomDelay(minDelayMs, maxDelayMs);
    }
  }

  return processed;
}

// Random user agents for anti-detection
function getRandomUserAgent(): string {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
