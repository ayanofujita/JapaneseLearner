import {
  translations,
  savedWords,
  users,
  type Translation,
  type InsertTranslation,
  type SavedWord,
  type InsertSavedWord,
  type User,
  type InsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
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
  async saveWord(
    word: InsertSavedWord & { userId: number },
  ): Promise<SavedWord> {
    const [newWord] = await db.insert(savedWords).values(word).returning();
    return newWord;
  }

  async getSavedWords(userId: number): Promise<SavedWord[]> {
    if (userId) {
      return await db
        .select()
        .from(savedWords)
        .where(eq(savedWords.userId, userId));
    }
    return await db.select().from(savedWords);
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
}

export const storage = new DatabaseStorage();
