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
    const systemPrompt = `You are a Japanese language processor that adds furigana to kanji. 
Your only task is to add HTML ruby tags with furigana readings to all kanji in the provided Japanese text.
You must ONLY return the processed text with ruby tags, with no explanations, comments, or additional text.`;

    const prompt = `Add HTML ruby tags with furigana readings to all kanji in this Japanese text.
Example format: <ruby>漢字<rt>かんじ</rt></ruby>
Process this text: ${text}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
    });

    return response.choices[0].message.content || text;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to add furigana: ${message}`);
  }
}