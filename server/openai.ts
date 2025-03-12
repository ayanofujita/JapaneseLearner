
import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateText(text: string, tone: 'casual' | 'formal'): Promise<string> {
  try {
    const systemPrompt = `You are a professional Japanese translator. Translate the following English text to Japanese.
Use ${tone} tone. Preserve the meaning and nuance of the original text while making it natural in Japanese.
Respond with only the translated text, no explanations.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
    });

    return response.choices[0].message.content || '';
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Translation failed: ${message}`);
  }
}

export async function addFurigana(text: string): Promise<string> {
  try {
    const systemPrompt = `You are a Japanese language processor. Your task is to:
1. Add HTML ruby tags with furigana readings to all kanji in the provided Japanese text
2. Wrap each meaningful Japanese word (including compounds of kanji, hiragana, and katakana) in <span class="jp-word"> tags
3. Keep particles (は、が、の、etc.) and punctuation outside of spans unless they're part of a word
4. Preserve spaces and line breaks

Example input: 勉強するのが好きです。
Example output: <span class="jp-word"><ruby>勉強<rt>べんきょう</rt></ruby>する</span>のが<span class="jp-word"><ruby>好<rt>す</rt></ruby>き</span>です。

Do not include markdown formatting or any explanations in your response.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.1,
    });

    // Strip any markdown code block syntax if present
    let content = response.choices[0].message.content || text;
    content = content.replace(/^```html\s*/g, '').replace(/\s*```$/g, '');

    return content;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to add furigana: ${message}`);
  }
}

// New combined function that handles both translation and furigana in one API call
export async function translateTextWithFurigana(text: string, tone: 'casual' | 'formal'): Promise<string> {
  try {
    const systemPrompt = `You are a professional Japanese translator and language processor. 
Your task is to:
1. Translate the following English text to Japanese using ${tone} tone
2. Add HTML ruby tags with furigana readings to all kanji in your translated text
3. Wrap each meaningful Japanese word (including compounds of kanji, hiragana, and katakana) in <span class="jp-word"> tags
4. Keep particles (は、が、の、etc.) and punctuation outside of spans unless they're part of a word
5. Preserve any spaces and line breaks

Example output format for "I like studying": 
<span class="jp-word"><ruby>勉強<rt>べんきょう</rt></ruby>する</span>のが<span class="jp-word"><ruby>好<rt>す</rt></ruby>き</span>です。

Respond with only the formatted Japanese translation, no explanations or English text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.1,
    });

    // Strip any markdown code block syntax if present
    let content = response.choices[0].message.content || '';
    content = content.replace(/^```html\s*/g, '').replace(/\s*```$/g, '');

    return content;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Translation and furigana generation failed: ${message}`);
  }
}
