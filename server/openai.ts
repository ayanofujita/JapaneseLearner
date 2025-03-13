import OpenAI from "openai";
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateText(
  text: string,
  tone: "casual" | "formal",
): Promise<string> {
  try {
    const systemPrompt = `You are a professional Japanese translator specialized in natural, culturally appropriate translations.
Task: Translate the English text to Japanese using a ${tone} tone.
Requirements:
- Preserve the original meaning, nuance, and emotion
- Ensure the translation sounds natural to native Japanese speakers
- Adjust cultural references appropriately for a Japanese audience
- For formal tone: Use です/ます form, appropriate keigo where needed
- For casual tone: Use plain form (だ/である) with appropriate colloquialisms
- Output ONLY the translated Japanese text with no explanations, notes, or English text`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
    });
    return response.choices[0].message.content || "";
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Translation failed: ${message}`);
  }
}

export async function addFurigana(text: string): Promise<string> {
  try {
    const systemPrompt = `You are a specialized Japanese language processor with expertise in furigana annotation.

TASK: Add precise furigana markup to Japanese text

STRICT OUTPUT FORMAT REQUIREMENTS:
1. Every kanji or kanji compound MUST be wrapped in <ruby> tags
2. Every reading MUST be wrapped in <rt> tags
3. Every meaningful word (including compounds) MUST be wrapped in <span class="jp-word"> tags
4. Particles (は、が、の、etc.) and punctuation must remain outside spans unless part of a word
5. Spaces and line breaks must be preserved exactly as in the input

EXAMPLES:
Input: 勉強するのが好きです。
Output: <span class="jp-word"><ruby>勉強<rt>べんきょう</rt></ruby>する</span>のが<span class="jp-word"><ruby>好<rt>す</rt></ruby>き</span>です。

Input: 私は東京に住んでいます。
Output: <span class="jp-word"><ruby>私<rt>わたし</rt></ruby></span>は<span class="jp-word"><ruby>東京<rt>とうきょう</rt></ruby></span>に<span class="jp-word"><ruby>住<rt>す</rt></ruby>んでいます</span>。

Input: 2023年5月3日に彼の誕生日パーティーがありました。
Output: <span class="jp-word"><ruby>2023年<rt>にせんにじゅうさんねん</rt></ruby></span><span class="jp-word"><ruby>5月<rt>ごがつ</rt></ruby></span><span class="jp-word"><ruby>3日<rt>みっか</rt></ruby></span>に<span class="jp-word"><ruby>彼<rt>かれ</rt></ruby></span>の<span class="jp-word"><ruby>誕生日<rt>たんじょうび</rt></ruby>パーティー</span>がありました。

ERRORS TO AVOID:
- NEVER omit <rt> tags
- NEVER use plain text readings outside of <rt> tags
- NEVER wrap single hiragana/katakana characters in ruby unless they're part of a compound word

OUTPUT ONLY THE MARKED-UP TEXT WITH NO EXPLANATIONS.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.1, // Very low temperature for consistent formatting
    });

    // Strip any markdown code block syntax if present
    let content = response.choices[0].message.content || text;
    content = content.replace(/^```html\s*/g, "").replace(/\s*```$/g, "");

    return content;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    throw new Error(`Failed to add furigana: ${message}`);
  }
}

export async function generateTitle(text: string): Promise<string> {
  try {
    const systemPrompt = `You are a concise title generator for translations.
    
TASK: Generate a brief, descriptive title (max 5 words) for the given text.
- The title should reflect the main topic or theme of the text
- Keep it short and concise, ideally 2-5 words
- Do not use quotation marks around the title
- Return ONLY the title with no additional text or explanations`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 15
    });

    return response.choices[0].message.content?.trim() || "Translation";
  } catch (error: unknown) {
    console.error("Failed to generate title:", error);
    return "Translation"; // Fallback title
  }
}
