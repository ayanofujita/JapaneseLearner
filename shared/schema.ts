import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  englishText: text("english_text").notNull(),
  japaneseText: text("japanese_text").notNull(),
  tone: text("tone").notNull(), // 'casual' | 'formal'
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedWords = pgTable("saved_words", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  reading: text("reading").notNull(),
  meaning: text("meaning").notNull(),
  context: text("context"),
  nextReview: timestamp("next_review"),
  reviewCount: integer("review_count").default(0),
});

export const insertTranslationSchema = createInsertSchema(translations).pick({
  englishText: true,
  japaneseText: true,
  tone: true,
});

export const insertSavedWordSchema = createInsertSchema(savedWords).pick({
  word: true,
  reading: true,
  meaning: true,
  context: true,
});

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type SavedWord = typeof savedWords.$inferSelect;
export type InsertSavedWord = z.infer<typeof insertSavedWordSchema>;

export const translateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  tone: z.enum(['casual', 'formal'])
});

export type TranslateRequest = z.infer<typeof translateRequestSchema>;
