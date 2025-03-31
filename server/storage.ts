import {
  translations,
  savedWords,
  users,
  quizResults,
  quizWordAttempts,
  type Translation,
  type InsertTranslation,
  type SavedWord,
  type InsertSavedWord,
  type User,
  type InsertUser,
  type QuizResult,
  type InsertQuizResult,
  type QuizWordAttempt,
  type InsertQuizWordAttempt,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { sql } from 'drizzle-orm/sql';
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Translation methods
  createTranslation(
    translation: InsertTranslation & { userId: number },
  ): Promise<Translation>;
  getTranslations(userId: number): Promise<Translation[]>;
  getTranslation(id: number): Promise<Translation | undefined>;
  deleteTranslation(id: number): Promise<void>;

  // Saved word methods
  saveWord(word: InsertSavedWord & { userId: number }): Promise<SavedWord>;
  getSavedWords(userId: number): Promise<SavedWord[]>;
  updateWordReview(id: number, nextReview: Date): Promise<SavedWord>;
  getWordCount(userId: number, wordText: string): Promise<number>;
  deleteWord(id: number): Promise<void>;
  
  // Quiz methods
  createQuizResult(result: InsertQuizResult & { userId: number }): Promise<QuizResult>;
  getQuizResults(userId: number, limit?: number): Promise<QuizResult[]>;
  saveQuizWordAttempt(
    attempt: InsertQuizWordAttempt & { quizResultId: number }
  ): Promise<QuizWordAttempt>;
  getQuizWordAttempts(quizResultId: number): Promise<QuizWordAttempt[]>;
  getQuizStats(userId: number): Promise<{ 
    totalQuizzes: number; 
    totalCorrect: number; 
    totalQuestions: number;
    byType: Record<string, { correct: number; total: number }>;
  }>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Translation methods
  async createTranslation(
    translation: InsertTranslation & { userId: number },
  ): Promise<Translation> {
    const [newTranslation] = await db
      .insert(translations)
      .values(translation)
      .returning();
    return newTranslation;
  }

  async getTranslations(userId: number): Promise<Translation[]> {
    if (userId) {
      return await db
        .select()
        .from(translations)
        .where(eq(translations.userId, userId));
    }
    return await db.select().from(translations);
  }

  async getTranslation(id: number): Promise<Translation | undefined> {
    const [translation] = await db
      .select()
      .from(translations)
      .where(eq(translations.id, id));
    return translation;
  }

  async deleteTranslation(id: number): Promise<void> {
    await db.delete(translations).where(eq(translations.id, id));
  }

  // Saved word methods
  async saveWord(word: InsertSavedWord & { userId: number }): Promise<SavedWord> {
    // Check if this word already exists for this user
    const existingWords = await db
      .select()
      .from(savedWords)
      .where(and(
        eq(savedWords.userId, word.userId),
        eq(savedWords.word, word.word)
      ));

    // If the word already exists, return it instead of creating a duplicate
    if (existingWords.length > 0) {
      return existingWords[0];
    }

    // Otherwise insert the new word
    const [savedWord] = await db
      .insert(savedWords)
      .values(word)
      .returning();
    return savedWord;
  }

  async getSavedWords(userId: number): Promise<SavedWord[]> {
    return await db
      .select()
      .from(savedWords)
      .where(eq(savedWords.userId, userId));
  }

  async getWordCount(userId: number, wordText: string): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(savedWords)
      .where(and(
        eq(savedWords.userId, userId),
        eq(savedWords.word, wordText)
      ));

    return Number(result[0]?.count || 0);
  }

  async updateWordReview(id: number, nextReview: Date): Promise<SavedWord> {
    const [word] = await db
      .select()
      .from(savedWords)
      .where(eq(savedWords.id, id));
    if (!word) throw new Error("Word not found");

    const [updatedWord] = await db
      .update(savedWords)
      .set({
        nextReview,
        reviewCount: (word.reviewCount || 0) + 1,
      })
      .where(eq(savedWords.id, id))
      .returning();

    return updatedWord;
  }

  async deleteWord(id: number): Promise<void> {
    await db.delete(savedWords).where(eq(savedWords.id, id));
  }

  // Quiz methods
  async createQuizResult(result: InsertQuizResult & { userId: number }): Promise<QuizResult> {
    const [newQuizResult] = await db
      .insert(quizResults)
      .values(result)
      .returning();
    return newQuizResult;
  }

  async getQuizResults(userId: number, limit?: number): Promise<QuizResult[]> {
    const query = db
      .select()
      .from(quizResults)
      .where(eq(quizResults.userId, userId))
      .orderBy(desc(quizResults.completedAt));
    
    // Apply limit if specified
    const results = limit ? await query.limit(limit) : await query;
    return results;
  }

  async saveQuizWordAttempt(
    attempt: InsertQuizWordAttempt & { quizResultId: number }
  ): Promise<QuizWordAttempt> {
    const [newAttempt] = await db
      .insert(quizWordAttempts)
      .values(attempt)
      .returning();
    return newAttempt;
  }

  async getQuizWordAttempts(quizResultId: number): Promise<QuizWordAttempt[]> {
    return await db
      .select()
      .from(quizWordAttempts)
      .where(eq(quizWordAttempts.quizResultId, quizResultId));
  }

  async getQuizStats(userId: number): Promise<{ 
    totalQuizzes: number; 
    totalCorrect: number; 
    totalQuestions: number;
    byType: Record<string, { correct: number; total: number }>;
  }> {
    // Get all quiz results for this user
    const results = await db
      .select()
      .from(quizResults)
      .where(eq(quizResults.userId, userId));
    
    // Calculate aggregate stats
    const totalQuizzes = results.length;
    const totalCorrect = results.reduce((sum, result) => sum + result.correctCount, 0);
    const totalQuestions = results.reduce((sum, result) => sum + result.totalCount, 0);
    
    // Calculate stats by quiz type
    const byType: Record<string, { correct: number; total: number }> = {};
    
    for (const result of results) {
      if (!byType[result.quizType]) {
        byType[result.quizType] = { correct: 0, total: 0 };
      }
      
      byType[result.quizType].correct += result.correctCount;
      byType[result.quizType].total += result.totalCount;
    }
    
    return {
      totalQuizzes,
      totalCorrect,
      totalQuestions,
      byType
    };
  }
}

export const storage = new DatabaseStorage();