import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SavedWord, QuizResult } from "@shared/schema";
import { AlertCircle, AlertTriangle, BadgeCheck, BookOpen, Award } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type QuizResultDetails = {
  id: number;
  correctCount: number;
  totalCount: number;
  score: number;
  quizType: string;
  completedAt: Date | string;
};

const QuizResultCard = ({ result }: { result: QuizResult }) => {
  // Ensure we have a valid date value before creating a Date object
  const completedAt = result.completedAt ? result.completedAt : new Date().toISOString();
  const formattedDate = new Date(completedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const score = (result.correctCount / result.totalCount) * 100;
  
  return (
    <div className="border rounded-md p-4 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-medium">
            {result.quizType === "meaning" ? "English to Japanese" : "Japanese to English"}
          </h3>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-xl">{score.toFixed(0)}%</p>
          <p className="text-sm text-muted-foreground">
            {result.correctCount} of {result.totalCount} correct
          </p>
        </div>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
};

interface QuizStats {
  totalQuizzes: number;
  totalCorrect: number;
  totalQuestions: number;
  byType: Record<string, { correct: number; total: number }>;
}

const QuizStats = () => {
  const { data: stats, isLoading } = useQuery<QuizStats>({
    queryKey: ["/api/quiz/stats"],
    queryFn: async () => {
      const res = await fetch("/api/quiz/stats");
      if (!res.ok) throw new Error("Failed to fetch quiz stats");
      return res.json();
    },
  });

  const { data: results } = useQuery<QuizResult[]>({
    queryKey: ["/api/quiz/results"],
    queryFn: async () => {
      const res = await fetch("/api/quiz/results");
      if (!res.ok) throw new Error("Failed to fetch quiz results");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading your quiz statistics...</div>;
  }

  if (!stats || stats.totalQuizzes === 0) {
    return (
      <Alert variant="default" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>No quiz results yet</AlertTitle>
        <AlertDescription>
          Take a quiz to start tracking your progress!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalQuestions > 0 
                ? ((stats.totalCorrect / stats.totalQuestions) * 100).toFixed(1) + '%'
                : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalCorrect} of {stats.totalQuestions} questions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Quiz Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.byType).map(([type, data]: [string, { correct: number; total: number }]) => (
              <div key={type} className="grid grid-cols-2 gap-1 text-sm">
                <div>{type === "meaning" ? "En→Jp" : "Jp→En"}</div>
                <div className="text-right">
                  {((data.correct / data.total) * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {results && results.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Recent Quiz Results</h3>
          <div className="space-y-3">
            {results.slice(0, 5).map((result: QuizResult) => (
              <QuizResultCard key={result.id} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function QuizPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [quizInProgress, setQuizInProgress] = useState(false);
  const [quizType, setQuizType] = useState<"meaning" | "reading">("meaning");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ wordId: number; correct: boolean }>>([]);
  const [quizWords, setQuizWords] = useState<SavedWord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResultDetails | null>(null);

  // Fetch available words
  const { data: words, isLoading: isLoadingWords, error: wordsError, refetch: refetchWords } = useQuery<SavedWord[]>({
    queryKey: ["/api/words"],
    queryFn: async () => {
      const res = await fetch("/api/words");
      if (!res.ok) throw new Error("Failed to fetch words");
      return res.json();
    },
  });

  // Start quiz mutation
  const { mutate: startQuiz, isPending: isStartingQuiz } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/quiz/words");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to start quiz");
      }
      return res.json();
    },
    onSuccess: (data: SavedWord[]) => {
      setQuizWords(data);
      setCurrentIndex(0);
      setAnswers([]);
      setQuizInProgress(true);
      setQuizCompleted(false);
      setQuizResult(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to start quiz",
        description: error.message,
      });
    },
  });

  // Submit quiz mutation
  const { mutate: submitQuiz, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: { quizType: string; answers: Array<{ wordId: number; correct: boolean }> }) => {
      const res = await apiRequest("POST", "/api/quiz/submit", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit quiz");
      }
      return res.json();
    },
    onSuccess: (data: QuizResultDetails) => {
      setQuizResult(data);
      setQuizCompleted(true);
      setQuizInProgress(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/quiz/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quiz/stats"] });
      
      toast({
        title: "Quiz completed!",
        description: `You scored ${data.score.toFixed(1)}% (${data.correctCount}/${data.totalCount})`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to submit quiz",
        description: error.message,
      });
    },
  });

  const handleStartQuiz = (type: "meaning" | "reading") => {
    setQuizType(type);
    startQuiz();
  };

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const checkAnswer = (): boolean => {
    if (!selectedAnswer || !quizWords[currentIndex]) return false;
    
    if (quizType === "meaning") {
      // Meaning quiz: show Japanese, answer with meaning
      return selectedAnswer.toLowerCase() === quizWords[currentIndex].meaning.toLowerCase();
    } else {
      // Reading quiz: show word, answer with reading
      return selectedAnswer.toLowerCase() === quizWords[currentIndex].reading.toLowerCase();
    }
  };

  const handleNextQuestion = () => {
    if (!selectedAnswer) return;
    
    const isCorrect = checkAnswer();
    const newAnswers = [...answers, { wordId: quizWords[currentIndex].id, correct: isCorrect }];
    setAnswers(newAnswers);
    
    // Show the result briefly
    setShowResult(true);
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer(null);
      
      if (currentIndex < quizWords.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Last question, submit the quiz
        submitQuiz({
          quizType,
          answers: newAnswers,
        });
      }
    }, 1500);
  };

  const currentWord = quizInProgress && quizWords.length > 0 ? quizWords[currentIndex] : null;
  const progress = quizWords.length ? ((currentIndex + (showResult ? 1 : 0)) / quizWords.length) * 100 : 0;
  const hasEnoughWords = words && words.length >= 5;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Japanese Vocabulary Quiz</h1>
        <p className="text-muted-foreground mt-2">
          Test your knowledge of Japanese vocabulary
        </p>
      </div>

      <Tabs defaultValue="quiz" className="mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quiz">Take Quiz</TabsTrigger>
          <TabsTrigger value="stats">Quiz History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="quiz" className="mt-6">
          {!quizInProgress && !quizCompleted && (
            <Card>
              <CardHeader>
                <CardTitle>Start a New Quiz</CardTitle>
                <CardDescription>
                  Choose a quiz type to practice your vocabulary
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasEnoughWords ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Not enough saved words</AlertTitle>
                    <AlertDescription>
                      You need at least 5 saved words to take a quiz. Go save some words first!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors" 
                      onClick={() => handleStartQuiz("meaning")}>
                      <CardHeader>
                        <CardTitle className="text-center">
                          <BookOpen className="h-8 w-8 mx-auto mb-2" />
                          English to Japanese
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground text-center">
                          See the English meaning, recall the Japanese word
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleStartQuiz("reading")}>
                      <CardHeader>
                        <CardTitle className="text-center">
                          <BookOpen className="h-8 w-8 mx-auto mb-2" />
                          Japanese to English
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground text-center">
                          See the Japanese word, recall the English meaning
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {quizInProgress && currentWord && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Question {currentIndex + 1} of {quizWords.length}</div>
                <div className="text-sm font-medium">
                  {answers.filter(a => a.correct).length} correct
                </div>
              </div>
              
              <Progress value={progress} className="h-2" />
              
              <Card className={showResult ? (checkAnswer() ? "border-green-500" : "border-red-500") : ""}>
                <CardHeader>
                  <CardTitle className="text-center text-2xl">
                    {quizType === "meaning" ? (
                      // For meaning quiz, show English and ask for Japanese
                      <span>{currentWord.meaning}</span>
                    ) : (
                      // For reading quiz, show Japanese and ask for English/reading
                      <span className="text-3xl">{currentWord.word}</span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!showResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border rounded-md p-2">
                        <Label htmlFor="answer">Your answer:</Label>
                        <input
                          id="answer"
                          type="text"
                          className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0"
                          placeholder={quizType === "meaning" ? "Japanese word..." : "English meaning..."}
                          value={selectedAnswer || ""}
                          onChange={(e) => handleAnswer(e.target.value)}
                          disabled={showResult}
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      {checkAnswer() ? (
                        <div className="text-green-500 font-medium flex flex-col items-center">
                          <BadgeCheck className="h-12 w-12 mb-2" />
                          <span>Correct!</span>
                        </div>
                      ) : (
                        <div className="text-red-500 font-medium">
                          <div className="mb-2">Incorrect</div>
                          <div className="text-lg">
                            The correct answer is: {" "}
                            <span className="font-bold">
                              {quizType === "meaning" ? currentWord.word : currentWord.meaning}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  {!showResult && (
                    <Button 
                      onClick={handleNextQuestion} 
                      disabled={!selectedAnswer}
                    >
                      {currentIndex < quizWords.length - 1 ? "Next Question" : "Finish Quiz"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
          
          {quizCompleted && quizResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Quiz Results</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-muted">
                  <Award className="h-12 w-12" />
                </div>
                
                <div>
                  <h2 className="text-4xl font-bold mb-2">{quizResult.score.toFixed(1)}%</h2>
                  <p className="text-muted-foreground">
                    You got {quizResult.correctCount} out of {quizResult.totalCount} questions correct
                  </p>
                </div>
                
                <Progress 
                  value={quizResult.score} 
                  className="h-3"
                />
              </CardContent>
              <CardFooter className="justify-center">
                <Button 
                  onClick={() => {
                    setQuizCompleted(false);
                    setQuizResult(null);
                  }}
                >
                  Start a New Quiz
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Quiz History</CardTitle>
              <CardDescription>
                Track your progress and see your performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuizStats />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}