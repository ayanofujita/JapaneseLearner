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
 * Step 1: Wrap appropriate words in jp-word spans
 * This function identifies Japanese words and wraps them in spans
 */
export function wrapJapaneseWords(text: string): string {
  // This regex matches consecutive Japanese characters (kanji, hiragana, or katakana)
  const japaneseWordPattern = /[一-龯ぁ-んァ-ン]+[一-龯ぁ-んァ-ン]*/g;

  // Common Japanese particles to exclude from word wrapping
  const particles = [
    "は",
    "が",
    "の",
    "を",
    "に",
    "へ",
    "で",
    "と",
    "も",
    "や",
    "か",
    "より",
    "から",
    "まで",
    "ながら",
    "ので",
    "のに",
    "けれど",
    "けれども",
    "が",
    "けど",
  ];

  // Store positions of all particles to avoid wrapping them
  const particlePositions = [];
  for (const particle of particles) {
    let position = -1;
    while ((position = text.indexOf(particle, position + 1)) !== -1) {
      // Check if it's a standalone particle (not part of a word)
      const prevChar = position > 0 ? text.charAt(position - 1) : "";
      const nextChar =
        position + particle.length < text.length
          ? text.charAt(position + particle.length)
          : "";

      const isPrevJapanese = /[一-龯ぁ-んァ-ン]/.test(prevChar);
      const isNextJapanese = /[一-龯ぁ-んァ-ン]/.test(nextChar);

      // If it looks like a standalone particle
      if (!isPrevJapanese || !isNextJapanese) {
        particlePositions.push({
          start: position,
          end: position + particle.length,
        });
      }
    }
  }

  // Find all Japanese words
  const matches = [];
  let match;
  while ((match = japaneseWordPattern.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;

    // Check if this match overlaps with any particle
    const isParticle = particlePositions.some(
      (p) =>
        (start >= p.start && start < p.end) || (end > p.start && end <= p.end),
    );

    if (!isParticle) {
      matches.push({ start, end, text: match[0] });
    }
  }

  // Apply the spans, working from the end to avoid messing up indices
  let result = text;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { start, end } = matches[i];
    result =
      result.substring(0, start) +
      `<span class="jp-word">${result.substring(start, end)}</span>` +
      result.substring(end);
  }

  return result;
}

/**
 * Step 2: Add ruby tags to kanji characters within jp-word spans
 */
export async function addRubyToSpans(text: string): Promise<string> {
  try {
    const systemPrompt = `You are a specialized Japanese language processor with expertise in furigana annotation.

TASK: Add ruby markup to kanji characters ONLY within span tags

INPUT FORMAT: Text with Japanese words already wrapped in <span class="jp-word">...</span> tags

OUTPUT REQUIREMENTS:
1. ONLY modify content within <span class="jp-word"> tags:
   - Leave all text outside spans completely unchanged
   - Preserve all span tags exactly as they are

2. For kanji characters within spans:
   - Wrap ONLY the kanji characters in <ruby>...</ruby> tags
   - Add the reading in <rt>...</rt> tags
   - Do not modify hiragana or katakana within spans

3. Be precise about readings:
   - Provide accurate readings for each kanji based on context
   - Consider the word context for choosing the correct reading

EXAMPLE:

Input: "こんにちは<span class="jp-word">世界</span>と<span class="jp-word">日本語</span>の<span class="jp-word">勉強</span>。"

Output: "こんにちは<span class="jp-word"><ruby>世界<rt>せかい</rt></ruby></span>と<span class="jp-word"><ruby>日本語<rt>にほんご</rt></ruby></span>の<span class="jp-word"><ruby>勉強<rt>べんきょう</rt></ruby></span>。"

IMPORTANT: Output ONLY the text with ruby annotations added. No explanations, no markdown code blocks.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.1, // Very low temperature for consistent formatting
    });

    // Clean up the response
    let content = response.choices[0].message.content || text;
    return content.replace(/^```html\s*/g, "").replace(/\s*```$/g, "");
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Failed to add ruby: ${message}`);

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
 * Full furigana process that combines both steps in the improved order
 */
export async function addFurigana(text: string): Promise<string> {
  try {
    // Step 1: Wrap Japanese words with spans first
    const withSpans = wrapJapaneseWords(text);

    // Step 2: Add ruby annotations to kanji within spans
    const withRuby = await addRubyToSpans(withSpans);

    return withRuby;
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
