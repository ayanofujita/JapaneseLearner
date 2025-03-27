declare module "./quiz" {
  import { Translation } from "@shared/schema";

  export interface QuizQuestion {
    id: string;
    sentence: string;
    options: string[];
    correctAnswer: string;
    translation: string;
    blankWord: string;
    blankIndex: number;
    translationId: number;
  }

  export interface Quiz {
    questions: QuizQuestion[];
    difficulty: string;
    totalQuestions: number;
  }

  export function generateQuiz(
    translations: Translation[],
    count?: number,
    difficulty?: string
  ): Promise<Quiz>;
}