import { translations, savedWords, type Translation, type InsertTranslation, type SavedWord, type InsertSavedWord } from "@shared/schema";

export interface IStorage {
  // Translation methods
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslations(): Promise<Translation[]>;
  getTranslation(id: number): Promise<Translation | undefined>;

  // Saved word methods
  saveWord(word: InsertSavedWord): Promise<SavedWord>;
  getSavedWords(): Promise<SavedWord[]>;
  updateWordReview(id: number, nextReview: Date): Promise<SavedWord>;
}

export class MemStorage implements IStorage {
  private translations: Map<number, Translation>;
  private savedWords: Map<number, SavedWord>;
  private translationId: number = 1;
  private wordId: number = 1;

  constructor() {
    this.translations = new Map();
    this.savedWords = new Map();
  }

  async createTranslation(translation: InsertTranslation): Promise<Translation> {
    const id = this.translationId++;
    const newTranslation: Translation = {
      id,
      ...translation,
      createdAt: new Date()
    };
    this.translations.set(id, newTranslation);
    return newTranslation;
  }

  async getTranslations(): Promise<Translation[]> {
    return Array.from(this.translations.values());
  }

  async getTranslation(id: number): Promise<Translation | undefined> {
    return this.translations.get(id);
  }

  async saveWord(word: InsertSavedWord): Promise<SavedWord> {
    const id = this.wordId++;
    const newWord: SavedWord = {
      id,
      ...word,
      nextReview: new Date(),
      reviewCount: 0,
      context: word.context || null
    };
    this.savedWords.set(id, newWord);
    return newWord;
  }

  async getSavedWords(): Promise<SavedWord[]> {
    return Array.from(this.savedWords.values());
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