import fetch from "node-fetch";

interface KanjiDetails {
  kanji: string;
  grade?: number;
  stroke_count: number;
  meanings: string[];
  kun_readings: string[];
  on_readings: string[];
  name_readings: string[];
  jlpt?: number;
  unicode: string;
}

export async function getKanjiDetails(kanji: string): Promise<KanjiDetails> {
  try {
    const response = await fetch(
      `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(kanji)}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Kanji API error: ${response.statusText} (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Kanji API error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to fetch kanji data");
  }
}
