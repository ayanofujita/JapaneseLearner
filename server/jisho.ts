import fetch from "node-fetch";

interface JishoResponse {
  data: Array<{
    japanese: Array<{
      word?: string;
      reading: string;
    }>;
    senses: Array<{
      parts_of_speech: string[];
      english_definitions: string[];
      tags: string[];
      see_also: string[];
      antonyms: string[];
      source: string[];
      info: string[];
    }>;
  }>;
}

export async function searchWord(word: string): Promise<JishoResponse> {
  try {
    const response = await fetch(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`);
    if (!response.ok) {
      throw new Error(`Jisho API error: ${response.statusText}`);
    }
    return await response.json() as JishoResponse;
  } catch (error) {
    console.error("Jisho API error:", error);
    throw new Error("Failed to fetch word data from Jisho");
  }
}
