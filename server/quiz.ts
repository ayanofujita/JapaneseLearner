import { Translation } from "@shared/schema";
import { openai } from "./openai";

/**
 * Interface for a quiz question
 */
export interface QuizQuestion {
  id: string;
  sentence: string; // Sentence with blank for missing word
  options: string[]; // Multiple choice options
  correctAnswer: string; // The correct answer
  translation: string; // English translation of the sentence
  blankWord: string; // The word that was removed
  blankIndex: number; // Position of the blank in the options array
  translationId: number; // ID of the original translation
}

/**
 * Interface for a quiz with multiple questions
 */
export interface Quiz {
  questions: QuizQuestion[];
  difficulty: string;
  totalQuestions: number;
}

/**
 * Extract Japanese words that could be used for a quiz
 * Removes all HTML tags from the content to get clean text
 */
function removeHtmlTags(htmlText: string): string {
  // First, remove all span tags
  let cleanText = htmlText
    .replace(/<span[^>]*>/g, '')
    .replace(/<\/span>/g, '');
  
  // Then remove ruby and rt tags
  cleanText = cleanText
    .replace(/<ruby>/g, '')
    .replace(/<\/ruby>/g, '')
    .replace(/<rt>.*?<\/rt>/g, '');
  
  // Remove any other HTML tags that might be present
  cleanText = cleanText.replace(/<[^>]*>/g, '');
  
  return cleanText;
}

/**
 * Finds potential words to quiz from a piece of translated text
 */
function findQuizWords(text: string): string[] {
  // Split by common Japanese punctuation and spaces
  const words = text.split(/[\s、。？！]/);
  
  // Filter out very short words and empty strings
  return words
    .filter(word => word.length >= 2)
    .filter(word => word.trim() !== '');
}

/**
 * Extracts a complete sentence containing a specific word
 */
function extractSentence(text: string, word: string): string | null {
  // Split into sentences
  const sentences = text.split(/[。？！\n]/);
  
  // Find a sentence containing the word
  for (const sentence of sentences) {
    if (sentence.includes(word) && sentence.length >= 10) {
      return sentence.trim();
    }
  }
  
  return null;
}

/**
 * Generate distractors (wrong answers) for a quiz question
 */
async function generateDistractors(
  word: string, 
  count: number,
  savedWords: string[] = []
): Promise<string[]> {
  // If we have enough saved words, use some of them as distractors
  if (savedWords.length >= count) {
    const distractors: string[] = [];
    const shuffledWords = [...savedWords].sort(() => Math.random() - 0.5);
    
    for (const savedWord of shuffledWords) {
      if (!distractors.includes(savedWord) && savedWord !== word) {
        distractors.push(savedWord);
        if (distractors.length >= count) break;
      }
    }
    
    return distractors;
  }
  
  // Otherwise, use the OpenAI API to generate plausible distractors
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a Japanese language expert helping to create multiple-choice questions for language learning."
        },
        {
          role: "user",
          content: `Generate ${count} Japanese words that would make good distractors (wrong answers) for a multiple-choice question where the correct answer is "${word}". The words should be grammatically similar but clearly different in meaning. Return only a JSON array of strings.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 150
    });
    
    const responseContent = response.choices[0]?.message?.content || '{"words": []}';
    const parsedResponse = JSON.parse(responseContent);
    return parsedResponse.words || [];
  } catch (error) {
    console.error("Error generating distractors:", error);
    // Fallback: generate simple distractors by modifying the original word
    return Array(count).fill(0).map((_, i) => `${word}${i + 1}`);
  }
}

/**
 * Generate a quiz question from a translation
 */
async function generateQuizQuestion(
  translation: Translation,
  savedWords: string[] = [],
  difficulty: string = 'medium'
): Promise<QuizQuestion | null> {
  try {
    // Clean the text to remove HTML tags
    const cleanText = removeHtmlTags(translation.japaneseText);
    
    // Find potential words to quiz
    const quizWords = findQuizWords(cleanText);
    
    if (quizWords.length === 0) {
      return null;
    }
    
    // Choose a random word from the potential quiz words
    const randomIndex = Math.floor(Math.random() * quizWords.length);
    const chosenWord = quizWords[randomIndex];
    
    // Extract a complete sentence containing the word
    const sentence = extractSentence(cleanText, chosenWord);
    if (!sentence) {
      return null;
    }
    
    // Create a sentence with a blank
    const maskedSentence = sentence.replace(chosenWord, '______');
    
    // Generate 3 distractors (wrong answers)
    const distractors = await generateDistractors(chosenWord, 3, savedWords);
    
    // Create options by combining the correct answer and distractors
    const options = [...distractors, chosenWord];
    
    // Randomize the order of options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);
    
    // Find the index of the correct answer in the shuffled options
    const blankIndex = shuffledOptions.indexOf(chosenWord);
    
    return {
      id: `q-${translation.id}-${Date.now()}`,
      sentence: maskedSentence,
      options: shuffledOptions,
      correctAnswer: chosenWord,
      translation: translation.englishText,
      blankWord: chosenWord,
      blankIndex,
      translationId: translation.id
    };
  } catch (error) {
    console.error("Error generating quiz question:", error);
    return null;
  }
}

/**
 * Generate a quiz with multiple questions
 */
export async function generateQuiz(
  translations: Translation[],
  count: number = 5,
  difficulty: string = 'medium'
): Promise<Quiz> {
  // Gather all saved words from all translations to use as potential distractors
  const allWords: string[] = [];
  for (const translation of translations) {
    const cleanText = removeHtmlTags(translation.japaneseText);
    const words = findQuizWords(cleanText);
    allWords.push(...words);
  }
  
  // Shuffle translations to randomize questions
  const shuffledTranslations = [...translations].sort(() => Math.random() - 0.5);
  
  // Generate questions
  const questions: QuizQuestion[] = [];
  
  for (const translation of shuffledTranslations) {
    if (questions.length >= count) break;
    
    const question = await generateQuizQuestion(translation, allWords, difficulty);
    if (question) {
      questions.push(question);
    }
  }
  
  return {
    questions,
    difficulty,
    totalQuestions: questions.length,
  };
}