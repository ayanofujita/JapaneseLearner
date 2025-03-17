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

/**
 * Step 1: Identify individual Japanese words and wrap them in spans
 */
export async function identifyAndWrapWords(text: string): Promise<string> {
  try {
    const systemPrompt = `You are a Japanese language expert who can identify individual words in Japanese text.

TASK: Identify INDIVIDUAL Japanese words in the text and wrap ONLY single words in <span class="jp-word"> tags.

CRITICAL RULES:
1. Wrap ONLY SINGLE WORDS in <span class="jp-word"> tags:
   - Individual nouns (名詞): 本, 東京, 先生
   - Individual verbs (動詞): 読む, 食べる, 行く
   - Individual adjectives (形容詞/形容動詞): 美しい, 静か, 赤い
   - Individual adverbs (副詞): とても, すぐに, もっと

2. DO NOT wrap in spans:
   - Particles (助詞): は, が, の, を, に, へ, で, と, etc.
   - Punctuation: 。, 、, ！, ？, etc.
   - Multiple words or phrases together
   - Entire clauses or sentences

3. CRITICAL: Each span must contain EXACTLY ONE WORD:
   - "美しい花" should be "<span class="jp-word">美しい</span><span class="jp-word">花</span>"
   - NOT "<span class="jp-word">美しい花</span>" (wrong - contains two words)

4. Compound words count as single words:
   - Examples: 日本語, 図書館, 新幹線

EXAMPLES:

Input: "私は東京に住んでいます。"
Correct: "<span class="jp-word">私</span>は<span class="jp-word">東京</span>に<span class="jp-word">住んで</span><span class="jp-word">います</span>。"
Incorrect: "<span class="jp-word">私は東京に住んでいます</span>。" (wrong - wraps an entire sentence)

Input: "彼女は美しい花を見ました。"
Correct: "<span class="jp-word">彼女</span>は<span class="jp-word">美しい</span><span class="jp-word">花</span>を<span class="jp-word">見ました</span>。"
Incorrect: "<span class="jp-word">彼女は美しい花を</span><span class="jp-word">見ました</span>。" (wrong - wraps multiple words together)

OUTPUT: The original text with individual words properly wrapped in spans.
Do not add any explanations, just output the modified text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.1, // Low temperature for consistent formatting
    });

    return response.choices[0].message.content || text;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Failed to identify words: ${message}`);
    return text; // Return original text if failed
  }
}

/**
 * Step 2: Add ruby tags to kanji within span tags
 */
export async function addRubyAnnotations(text: string): Promise<string> {
  try {
    const systemPrompt = `You are a Japanese language expert specializing in furigana annotations.

TASK: Add ruby annotations to kanji characters ONLY within <span class="jp-word"> tags.

RULES:
1. Only modify content inside <span class="jp-word"> tags
2. For kanji or kanji compounds inside spans:
   - Wrap them in <ruby> tags
   - Add the correct reading in <rt> tags
3. Do not modify anything outside of the spans
4. Do not change the span tags themselves

Example:
Input: "<span class="jp-word">日本語</span>を<span class="jp-word">勉強</span>します。"
Output: "<span class="jp-word"><ruby>日本語<rt>にほんご</rt></ruby></span>を<span class="jp-word"><ruby>勉強<rt>べんきょう</rt></ruby></span>します。"

Output ONLY the modified text, no explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.1, // Low temperature for consistent results
    });

    return response.choices[0].message.content || text;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Failed to add ruby annotations: ${message}`);

    // Simple fallback that adds ruby tags to kanji within spans
    return text.replace(
      /<span class="jp-word">([^<]+)<\/span>/g,
      (match, content) => {
        const withRuby = content.replace(/[\u4e00-\u9faf]+/g, (kanji) => {
          return `<ruby>${kanji}<rt>?</rt></ruby>`;
        });
        return `<span class="jp-word">${withRuby}</span>`;
      },
    );
  }
}

/**
 * Complete furigana process using two OpenAI calls
 */
export async function addFurigana(text: string): Promise<string> {
  try {
    // Step 1: Identify and wrap individual Japanese words
    const wrappedText = await identifyAndWrapWords(text);

    // Step 2: Add ruby annotations to kanji within spans
    const annotatedText = await addRubyAnnotations(wrappedText);

    return annotatedText;
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
