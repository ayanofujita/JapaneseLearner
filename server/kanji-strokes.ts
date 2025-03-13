import { Request, Response } from "express";
import fetch from "node-fetch";

// Handler for kanji stroke data API
export async function getKanjiStrokes(req: Request, res: Response) {
  try {
    const { code } = req.params;

    if (!code || !/^[0-9a-f]{4,6}$/i.test(code)) {
      return res.status(400).json({ error: "Invalid kanji code" });
    }

    // Fetch from KanjiVG GitHub repository
    // Using a simpler approach without SVG parsing
    const response = await fetch(
      `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${code}.svg`,
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch kanji data: ${response.statusText}`,
      });
    }

    const svgText = await response.text();

    // Extract path data directly using regex
    // This is more reliable than trying to parse the SVG
    const pathRegex = /d="([^"]+)"/g;
    let match;
    const strokeData = [];

    while ((match = pathRegex.exec(svgText)) !== null) {
      strokeData.push(match[1]);
    }

    if (strokeData.length === 0) {
      return res.status(404).json({ error: "No stroke data found in SVG" });
    }

    // Set cache headers
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");

    // Return the stroke data
    return res.status(200).json({ strokeData });
  } catch (error) {
    console.error("Error processing kanji stroke data:", error);
    return res.status(500).json({ error: "Failed to process kanji data" });
  }
}
