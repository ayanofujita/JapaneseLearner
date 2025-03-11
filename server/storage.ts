import { translations, savedWords, users, type Translation, type InsertTranslation, type SavedWord, type InsertSavedWord, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Translation methods
  createTranslation(translation: InsertTranslation & { userId?: number }): Promise<Translation>;
  getTranslations(userId?: number): Promise<Translation[]>;
  getTranslation(id: number): Promise<Translation | undefined>;

  // Saved word methods
  saveWord(word: InsertSavedWord & { userId?: number }): Promise<SavedWord>;
  getSavedWords(userId?: number): Promise<SavedWord[]>;
  updateWordReview(id: number, nextReview: Date): Promise<SavedWord>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private translations: Map<number, Translation>;
  private savedWords: Map<number, SavedWord>;
  private userId: number = 1;
  private translationId: number = 1;
  private wordId: number = 1;

  constructor() {
    this.users = new Map();
    this.translations = new Map();
    this.savedWords = new Map();
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = {
      id,
      ...user,
      createdAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  // Translation methods
  async createTranslation(translation: InsertTranslation & { userId?: number }): Promise<Translation> {
    const id = this.translationId++;
    const newTranslation: Translation = {
      id,
      ...translation,
      userId: translation.userId || null,
      createdAt: new Date()
    };
    this.translations.set(id, newTranslation);
    return newTranslation;
  }

  async getTranslations(userId?: number): Promise<Translation[]> {
    const translations = Array.from(this.translations.values());
    return userId 
      ? translations.filter(t => t.userId === userId)
      : translations;
  }

  async getTranslation(id: number): Promise<Translation | undefined> {
    return this.translations.get(id);
  }

  // Saved word methods
  async saveWord(word: InsertSavedWord & { userId?: number }): Promise<SavedWord> {
    const id = this.wordId++;
    const newWord: SavedWord = {
      id,
      ...word,
      userId: word.userId || null,
      nextReview: new Date(),
      reviewCount: 0,
      context: word.context || null
    };
    this.savedWords.set(id, newWord);
    return newWord;
  }

  async getSavedWords(userId?: number): Promise<SavedWord[]> {
    const words = Array.from(this.savedWords.values());
    return userId 
      ? words.filter(w => w.userId === userId)
      : words;
  }

  async updateWordReview(id: number, nextReview: Date): Promise<SavedWord> {
    const word = this.savedWords.get(id);
    if (!word) throw new Error('Word not found');

    const updatedWord: SavedWord = {
      ...word,
      nextReview,
      reviewCount: (word.reviewCount || 0) + 1
    };
    this.savedWords.set(id, updatedWord);
    return updatedWord;
  }
}

export const storage = new MemStorage();