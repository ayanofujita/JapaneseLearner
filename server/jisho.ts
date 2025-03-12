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
      examples?: Array<{
        japanese: string;
        english: string;
      }>;
    }>;
  }>;
}

export async function searchWord(word: string): Promise<JishoResponse> {
  try {
    const response = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`,
      {
        headers: {
          'User-Agent': 'Japanese Learning App (https://replit.com)',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Jisho API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json() as JishoResponse;

    // Validate response structure
    if (!data || !Array.isArray(data.data)) {
      throw new Error('Invalid response format from Jisho API');
    }

    return data;
  } catch (error) {
    console.error("Jisho API error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch word data from Jisho");
  }
}