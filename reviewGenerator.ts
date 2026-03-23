import { invokeLLM } from "./_core/llm";

/**
 * AI-powered review content generator.
 * Generates unique, natural-sounding reviews based on business industry and sentiment type.
 */

const INDUSTRY_LABELS: Record<string, string> = {
  beauty: "美容/護膚",
  restaurant: "餐飲/餐廳",
  dating: "配對/交友服務",
  fitness: "健身/運動",
  medical: "醫療/診所",
  education: "教育/培訓",
  retail: "零售/購物",
  hotel: "酒店/住宿",
  automotive: "汽車/維修",
  legal: "法律/律師",
  finance: "金融/保險",
  realestate: "地產/物業",
  tech: "科技/IT服務",
  pet: "寵物服務",
  wedding: "婚禮/婚紗",
  photography: "攝影/影像",
  cleaning: "清潔/家政",
  moving: "搬運/物流",
  general: "一般商業",
};

export function getIndustryOptions() {
  return Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
}

export async function generateReviewContent(params: {
  businessName: string;
  industry: string;
  reviewType: "positive" | "negative";
  language?: string;
}): Promise<{ content: string; starRating: number }> {
  const { businessName, industry, reviewType, language = "zh-HK" } = params;

  const industryLabel = INDUSTRY_LABELS[industry] || INDUSTRY_LABELS.general;
  const isPositive = reviewType === "positive";
  const starRating = isPositive ? 5 : Math.floor(Math.random() * 2) + 1; // 5 for positive, 1-2 for negative

  const langInstruction = language === "zh-HK"
    ? "用廣東話口語（繁體中文）撰寫，語氣要自然像真人寫的，不要太正式"
    : language === "zh-TW"
    ? "用繁體中文撰寫，語氣自然"
    : language === "zh-CN"
    ? "用简体中文撰写，语气自然"
    : "Write in English with a natural, casual tone";

  const sentimentInstruction = isPositive
    ? "撰寫一則真實、正面的顧客評論。提及具體的服務體驗、員工態度、環境等細節，讓評論看起來像真正的顧客寫的。"
    : "撰寫一則真實但負面的顧客評論。提及具體的不滿意之處，但不要太過激烈，保持合理的批評。";

  const prompt = `你是一位真實的香港顧客，剛剛光顧了一間${industryLabel}類型的商家「${businessName}」。

${sentimentInstruction}

要求：
1. ${langInstruction}
2. 評論長度在 50-150 字之間
3. 不要使用任何標點符號如「！」過多，保持自然
4. 不要提及你是AI或這是生成的內容
5. 每次生成的內容都要不同，加入隨機的個人化細節
6. 可以適當使用一些口語化的表達
7. 不要使用emoji

只需要輸出評論內容，不需要任何其他說明或格式。`;

  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "你是一個評論內容生成器。只輸出評論文字，不要加任何前綴、後綴或說明。" },
        { role: "user", content: prompt },
      ],
    });

    let content = typeof result.choices[0]?.message?.content === "string"
      ? result.choices[0].message.content.trim()
      : "";

    if (!content) {
      throw new Error("LLM returned empty content");
    }

    // Ensure proper UTF-8 encoding for Chinese characters
    content = Buffer.from(content, 'utf8').toString('utf8');

    return { content, starRating };
  } catch (error) {
    console.error("[ReviewGenerator] LLM generation failed:", error);
    // Fallback to a basic template if LLM fails
    return {
      content: generateFallbackReview(businessName, industry, isPositive),
      starRating,
    };
  }
}

/**
 * Generate multiple unique reviews for batch task creation
 */
export async function generateBatchReviews(params: {
  businessName: string;
  industry: string;
  reviewType: "positive" | "negative";
  count: number;
  language?: string;
}): Promise<Array<{ content: string; starRating: number }>> {
  const results: Array<{ content: string; starRating: number }> = [];

  // Generate reviews one by one to ensure uniqueness
  for (let i = 0; i < params.count; i++) {
    const review = await generateReviewContent(params);
    results.push(review);

    // Small delay between generations to get different outputs
    if (i < params.count - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Fallback review generator when LLM is unavailable
 */
function generateFallbackReview(businessName: string, industry: string, isPositive: boolean): string {
  const positiveTemplates = [
    `${businessName}嘅服務真係幾好，員工態度好專業，環境都好舒服。下次一定會再嚟。`,
    `朋友介紹嚟${businessName}，體驗完覺得真係唔錯，性價比高，推薦俾大家。`,
    `第一次嚟${businessName}，整體感覺好好，服務細心，會再幫襯。`,
    `${businessName}嘅質素一直都好穩定，已經幫襯咗幾次，每次都好滿意。`,
    `搵咗好耐先搵到${businessName}，試過之後覺得好值得，服務態度好好。`,
  ];

  const negativeTemplates = [
    `${businessName}嘅服務一般般，等咗好耐先有人招呼，希望可以改善下。`,
    `去咗${businessName}，感覺同預期有啲落差，價錢偏貴但服務質素唔算好。`,
    `${businessName}嘅環境OK，但員工態度可以再好啲，感覺唔太用心。`,
  ];

  const templates = isPositive ? positiveTemplates : negativeTemplates;
  return templates[Math.floor(Math.random() * templates.length)];
}
