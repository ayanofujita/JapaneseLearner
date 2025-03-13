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

      OUTPUT REQUIREMENTS:
      1. Break the text into individual lexical units (words, particles, punctuation)
      2. For each KANJI-CONTAINING word ONLY:
         - Wrap it in <span class="jp-word"> tags
         - Wrap each kanji or kanji compound within that word in <ruby> tags
         - Wrap the reading for each kanji in <rt> tags
      3. Leave as plain text (NO span wrapping):
         - All particles (は、が、の、を、に、へ、で、etc.)
         - All punctuation (。、！？「」etc.)
         - Words written only in hiragana or katakana
         - Words written in romaji/English (like "Le Wagon", "iPhone", "Netflix")
         - Spaces and line breaks

      EXAMPLES OF CORRECT SEGMENTATION:
      - "私は東京に住んでいます。"
        ↓ Properly segmented as:
        <span class="jp-word"><ruby>私<rt>わたし</rt></ruby></span>は<span class="jp-word"><ruby>東京<rt>とうきょう</rt></ruby></span>に<span class="jp-word"><ruby>住<rt>す</rt></ruby>んでいます</span>。

      - "彼はLe Wagonでプログラミングを学びました。"
        ↓ Properly segmented as:
        <span class="jp-word"><ruby>彼<rt>かれ</rt></ruby></span>はLe Wagonで<span class="jp-word"><ruby>学<rt>まな</rt></ruby>びました</span>。

      CRITICAL ERRORS TO AVOID:
      - NEVER wrap the entire input in a single <span class="jp-word"> tag
      - NEVER wrap multiple distinct words in a single span
      - NEVER wrap particles (は、が、の、etc.) in <span> tags
      - NEVER wrap words that contain only hiragana/katakana in <span> tags
      - NEVER wrap romaji/English words in <span> tags
      - NEVER include hiragana/katakana-only parts of a sentence in spans unless they're attached to kanji

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
      max_tokens: 15,
    });

    return response.choices[0].message.content?.trim() || "Translation";
  } catch (error: unknown) {
    console.error("Failed to generate title:", error);
    return "Translation"; // Fallback title
  }
}
