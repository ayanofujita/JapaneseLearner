import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { BarChart2, Brain, RotateCcw, RefreshCw } from 'lucide-react';
import QuizQuestion from './quiz-question';

// Interface matching the server response
interface QuizQuestion {
  id: string;
  sentence: string;
  options: string[];
  correctAnswer: string;
  translation: string;
  blankWord: string;
  blankIndex: number;
  translationId: number;
}

interface Quiz {
  questions: QuizQuestion[];
  difficulty: string;
  totalQuestions: number;
}

export interface QuizProps {
  onComplete?: () => void;
}

export default function Quiz({ onComplete }: QuizProps) {
  const { toast } = useToast();
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);
  
  // Get quiz questions from the server
  const { data: quiz, isLoading, isError, error, refetch } = useQuery<Quiz>({
    queryKey: ['/api/quiz', difficulty, questionCount],
    enabled: false, // Don't automatically fetch
  });
  
  // Start the quiz when the user clicks the start button
  const handleStartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    refetch();
  };
  
  // Handle when a question is completed
  const handleQuestionComplete = (correct: boolean) => {
    if (correct) {
      setScore(prevScore => prevScore + 1);
    }
    
    // Check if that was the last question
    if (quiz && currentQuestionIndex >= quiz.questions.length - 1) {
      setQuizComplete(true);
      if (onComplete) {
        onComplete();
      }
    } else {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // Calculate percentage score
  const scorePercentage = quiz && quiz.questions.length > 0 
    ? Math.round((score / quiz.questions.length) * 100) 
    : 0;
  
  // If there's an error, show it
  useEffect(() => {
    if (isError && error instanceof Error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load quiz questions',
        variant: 'destructive',
      });
    }
  }, [isError, error, toast]);
  
  return (
    <div className="space-y-6">
      {/* Quiz configuration */}
      {!quiz && !isLoading && (
        <Card className="p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <Brain className="mr-2 h-5 w-5" />
                Translation Quiz
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Test your Japanese knowledge with fill-in-the-blank questions created from your translations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select 
                  value={difficulty} 
                  onValueChange={setDifficulty}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Questions</label>
                <Select 
                  value={questionCount.toString()} 
                  onValueChange={(value) => setQuestionCount(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select question count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Questions</SelectItem>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleStartQuiz}
            >
              Start Quiz
            </Button>
          </div>
        </Card>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </Card>
      )}
      
      {/* Active quiz */}
      {quiz && quiz.questions.length > 0 && !quizComplete && (
        <QuizQuestion
          {...quiz.questions[currentQuestionIndex]}
          onComplete={handleQuestionComplete}
          currentQuestion={currentQuestionIndex + 1}
          totalQuestions={quiz.questions.length}
        />
      )}
      
      {/* Quiz results */}
      {quizComplete && quiz && (
        <Card className="p-6">
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            
            <div className="py-8">
              <div className="flex justify-center items-center mb-4">
                <BarChart2 className="h-12 w-12 text-primary opacity-80" />
              </div>
              <div className="text-5xl font-bold">{scorePercentage}%</div>
              <p className="text-muted-foreground mt-2">
                You got {score} out of {quiz.questions.length} questions correct
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline"
                onClick={() => {
                  setCurrentQuestionIndex(0);
                  setScore(0);
                  setQuizComplete(false);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Same Quiz
              </Button>
              
              <Button onClick={handleStartQuiz}>
                <RefreshCw className="mr-2 h-4 w-4" />
                New Quiz
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* No questions available */}
      {quiz && quiz.questions.length === 0 && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <p>No quiz questions available. Try creating more translations first.</p>
            <Button variant="outline" onClick={handleStartQuiz}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}