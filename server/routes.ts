import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { translateRequestSchema, insertTranslationSchema, insertSavedWordSchema } from "@shared/schema";
import { translateText, addFurigana } from "./openai";
import { ZodError } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, tone } = translateRequestSchema.parse(req.body);

      const japaneseText = await translateText(text, tone);
      const withFurigana = await addFurigana(japaneseText);

      const translation = await storage.createTranslation({
        englishText: text,
        japaneseText: withFurigana,
        tone
      });

      res.json(translation);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ message });
      }
    }
  });

  app.get("/api/translations", async (_req, res) => {
    try {
      const translations = await storage.getTranslations();
      res.json(translations);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ message });
    }
  });

  app.post("/api/words", async (req, res) => {
    try {
      const word = insertSavedWordSchema.parse(req.body);
      const savedWord = await storage.saveWord(word);
      res.json(savedWord);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: "Invalid word data", errors: error.errors });
      } else {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(400).json({ message });
      }
    }
  });

  app.get("/api/words", async (_req, res) => {
    try {
      const words = await storage.getSavedWords();
      res.json(words);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
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
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}