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
      1. Wrap EACH JAPANESE WORD (including kanji, hiragana, and katakana words) in <span class="jp-word"> tags EXCEPT:
         - DO NOT wrap particles (は、が、の、を、に、へ、で、etc.)
         - DO NOT wrap punctuation (。、！？「」etc.)

      2. For words containing kanji:
         - For EACH KANJI CHARACTER or KANJI COMPOUND within that word:
           * Wrap only the kanji character(s) in <ruby> tags
           * Add the reading in <rt> tags
         - Any hiragana attached to the kanji should be inside the jp-word span but OUTSIDE the ruby tags

      3. For words containing only hiragana or katakana:
         - Simply wrap the entire word in <span class="jp-word"> tags
         - DO NOT add ruby/rt tags for these words

      4. Leave as plain text (NO span wrapping):
         - All particles (は、が、の、を、に、へ、で、etc.)
         - All punctuation (。、！？「」etc.)
         - Words written in romaji/English
         - Spaces and line breaks

      EXAMPLES OF CORRECT MARKUP:

      "私は東京に住んでいます。"
      ↓ Correctly marked up as:
      <span class="jp-word"><ruby>私<rt>わたし</rt></ruby></span>は<span class="jp-word"><ruby>東京<rt>とうきょう</rt></ruby></span>に<span class="jp-word"><ruby>住<rt>す</rt></ruby>んでいます</span>。

      "彼女は美しい花を見ました。"
      ↓ Correctly marked up as:
      <span class="jp-word"><ruby>彼女<rt>かのじょ</rt></ruby></span>は<span class="jp-word"><ruby>美<rt>うつく</rt></ruby>しい</span><span class="jp-word"><ruby>花<rt>はな</rt></ruby></span>を<span class="jp-word"><ruby>見<rt>み</rt></ruby>ました</span>。

      "日本語を勉強しています。"
      ↓ Correctly marked up as:
      <span class="jp-word"><ruby>日本語<rt>にほんご</rt></ruby></span>を<span class="jp-word"><ruby>勉強<rt>べんきょう</rt></ruby>しています</span>。

      "彼はLe Wagonでプログラミングを学びました。"
      ↓ Correctly marked up as:
      <span class="jp-word"><ruby>彼<rt>かれ</rt></ruby></span>はLe Wagonで<span class="jp-word">プログラミング</span>を<span class="jp-word"><ruby>学<rt>まな</rt></ruby>びました</span>。

      "ありがとうございます。でもカタカナの言葉も入れましょう。"
      ↓ Correctly marked up as:
      <span class="jp-word">ありがとう</span><span class="jp-word">ございます</span>。<span class="jp-word">でも</span><span class="jp-word">カタカナ</span>の<span class="jp-word"><ruby>言葉<rt>ことば</rt></ruby></span>も<span class="jp-word">入れましょう</span>。

      CRITICAL ERRORS TO AVOID:
      - NEVER wrap particles (は、が、の、etc.) in <span> tags
      - NEVER separate hiragana suffixes from their kanji base words when wrapping with jp-word
      - NEVER place hiragana parts of a word inside ruby tags
      - NEVER add ruby/rt tags to hiragana-only or katakana-only words
      - DO wrap complete Japanese words in jp-word spans, even if they contain only hiragana or katakana
      - Make sure to segment text into proper lexical units (words) - don't treat a sequence of multiple words as a single word

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
