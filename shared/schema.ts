import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title"),
  englishText: text("english_text").notNull(),
  japaneseText: text("japanese_text").notNull(),
  tone: text("tone").notNull(), // 'casual' | 'formal'
  createdAt: timestamp("created_at").defaultNow(),
  images: text("images").array(),
  tags: text("tags").array(), // Add tags array column
});

export const savedWords = pgTable("saved_words", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  word: text("word").notNull(),
  reading: text("reading").notNull(),
  meaning: text("meaning").notNull(),
  context: text("context"),
  nextReview: timestamp("next_review"),
  reviewCount: integer("review_count").default(0),
});

// New table for quiz results
export const quizResults = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  correctCount: integer("correct_count").notNull(),
  totalCount: integer("total_count").notNull(),
  quizType: text("quiz_type").notNull(), // 'meaning' | 'reading'
  completedAt: timestamp("completed_at").defaultNow(),
});

// New table for quiz attempts on individual words
export const quizWordAttempts = pgTable("quiz_word_attempts", {
  id: serial("id").primaryKey(),
  quizResultId: integer("quiz_result_id").notNull().references(() => quizResults.id),
  wordId: integer("word_id").notNull().references(() => savedWords.id),
  correct: boolean("correct").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertTranslationSchema = createInsertSchema(translations).pick({
  englishText: true,
  japaneseText: true,
  tone: true,
  title: true,
}).extend({
  images: z.array(z.string()).max(4).optional(),
  tags: z.array(z.string()).max(10).optional(), // Add tags to schema
});

export const insertSavedWordSchema = createInsertSchema(savedWords).pick({
  word: true,
  reading: true,
  meaning: true,
  context: true,
});

// Schema for quiz results
export const insertQuizResultSchema = createInsertSchema(quizResults).pick({
  correctCount: true,
  totalCount: true,
  quizType: true,
});

// Schema for quiz word attempts
export const insertQuizWordAttemptSchema = createInsertSchema(quizWordAttempts).pick({
  wordId: true,
  correct: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type SavedWord = typeof savedWords.$inferSelect;
export type InsertSavedWord = z.infer<typeof insertSavedWordSchema>;
export type QuizResult = typeof quizResults.$inferSelect;
export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizWordAttempt = typeof quizWordAttempts.$inferSelect;
export type InsertQuizWordAttempt = z.infer<typeof insertQuizWordAttemptSchema>;

export const translateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  tone: z.enum(['casual', 'formal']),
  title: z.string().optional(),
  images: z.array(z.string()).max(4).optional(),
  tags: z.array(z.string()).max(10).optional(), // Add tags to request schema
});

// Schema for quiz submission
export const quizSubmissionSchema = z.object({
  quizType: z.enum(['meaning', 'reading']),
  answers: z.array(z.object({
    wordId: z.number(),
    correct: z.boolean(),
  })),
});

export type TranslateRequest = z.infer<typeof translateRequestSchema>;
export type QuizSubmission = z.infer<typeof quizSubmissionSchema>;