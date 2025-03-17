import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { translateRequestSchema, insertSavedWordSchema } from "@shared/schema";
import { translateText, addFurigana, generateTitle } from "./openai";
import { ZodError } from "zod";
import { setupAuth } from "./auth";
import { searchWord } from "./jisho";
import { getKanjiDetails } from "./kanji";
import { getKanjiStrokes } from "./kanji-strokes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and middleware
  setupAuth(app);

  app.post("/api/translate", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { text, tone, title, images, tags } = translateRequestSchema.parse(
        req.body,
      );

      const japaneseText = await translateText(text, tone);
      const withFurigana = await addFurigana(japaneseText);

      // Generate title if not provided
      let translationTitle = title;
      if (!translationTitle) {
        translationTitle = await generateTitle(text);
      }

      const translation = await storage.createTranslation({
        englishText: text,
        japaneseText: withFurigana,
        tone,
        title: translationTitle,
        userId: req.user.id,
        images: images || [], // Include images array in the database insertion
        tags: tags || [], // Include tags array in the database insertion
      });

      res.json(translation);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res
          .status(400)
          .json({ message: "Invalid request data", errors: error.errors });
      } else {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        res.status(400).json({ message });
      }
    }
  });

  app.get("/api/translations", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const translations = await storage.getTranslations(req.user.id);
      res.json(translations);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  app.delete("/api/translations/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid translation ID" });
      }

      const translation = await storage.getTranslation(id);
      if (!translation) {
        return res.status(404).json({ message: "Translation not found" });
      }

      if (translation.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteTranslation(id);
      res.status(200).json({ message: "Translation deleted successfully" });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  app.post("/api/words", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const word = insertSavedWordSchema.parse(req.body);

      // Check if this is a new word by comparing the return value with the input
      const existingWordCount = await storage.getWordCount(
        req.user.id,
        word.word,
      );
      const savedWord = await storage.saveWord({
        ...word,
        userId: req.user.id,
      });

      // Send appropriate message if the word was already saved
      if (existingWordCount > 0) {
        return res.status(200).json({
          ...savedWord,
          message: "Word already saved",
        });
      }

      res.json(savedWord);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res
          .status(400)
          .json({ message: "Invalid word data", errors: error.errors });
      } else {
        const message =
          error instanceof Error ? error.message : "Unknown error occurred";
        res.status(400).json({ message });
      }
    }
  });

  app.get("/api/words", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const words = await storage.getSavedWords(req.user.id);
      res.json(words);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  app.patch("/api/words/:id/review", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid word ID" });
      }
      const nextReview = new Date(req.body.nextReview);
      if (isNaN(nextReview.getTime())) {
        return res.status(400).json({ message: "Invalid next review date" });
      }

      const word = await storage.updateWordReview(id, nextReview);
      res.json(word);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(400).json({ message });
    }
  });

  app.delete("/api/words/:id", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid word ID" });
      }

      // Verify the word belongs to the user before deleting
      const words = await storage.getSavedWords(req.user.id);
      const word = words.find(w => w.id === id);

      if (!word) {
        return res.status(404).json({ message: "Word not found" });
      }

      await storage.deleteWord(id);
      res.status(200).json({ message: "Word deleted successfully" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  app.get("/api/dictionary/:word", async (req, res) => {
    try {
      const { word } = req.params;
      const data = await searchWord(word);
      res.json(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  app.get("/api/kanji/:character", async (req, res) => {
    try {
      const { character } = req.params;
      const data = await getKanjiDetails(character);
      res.json(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  app.get("/api/kanji-strokes/:code", async (req, res) => {
    try {
      await getKanjiStrokes(req, res);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  app.get("/api/tags", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const translations = await storage.getTranslations(req.user.id);
      const uniqueTags = Array.from(
        new Set(translations.flatMap((t) => t.tags || [])),
      );

      res.json(uniqueTags);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      res.status(500).json({ message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}