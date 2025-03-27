import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckIcon, XIcon, HelpCircleIcon, ArrowRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface QuizQuestionProps {
  id: string;
  sentence: string;
  options: string[];
  correctAnswer: string;
  translation: string;
  blankWord: string;
  blankIndex: number;
  onComplete: (correct: boolean) => void;
  currentQuestion: number;
  totalQuestions: number;
}

export default function QuizQuestion({
  sentence,
  options,
  correctAnswer,
  translation,
  onComplete,
  currentQuestion,
  totalQuestions
}: QuizQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answered, setAnswered] = useState(false);
  
  const progress = (currentQuestion / totalQuestions) * 100;
  
  const handleOptionSelect = (option: string) => {
    if (answered) return;
    setSelectedOption(option);
  };
  
  const handleSubmit = () => {
    if (!selectedOption || answered) return;
    setAnswered(true);
    setShowAnswer(true);
  };
  
  const handleNext = () => {
    const isCorrect = selectedOption === correctAnswer;
    onComplete(isCorrect);
    setSelectedOption(null);
    setShowAnswer(false);
    setAnswered(false);
  };
  
  return (
    <Card className="p-6 w-full">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Fill in the blank</h3>
            <Badge variant="outline">Question {currentQuestion} of {totalQuestions}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <Tabs defaultValue="japanese" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="japanese">Japanese</TabsTrigger>
            <TabsTrigger value="english">English</TabsTrigger>
          </TabsList>
          <TabsContent value="japanese" className="pt-4">
            <p className="text-lg font-japanese leading-relaxed">
              {sentence.split('______').map((part, index, array) => {
                // If this is the last part, don't add the blank
                if (index === array.length - 1) {
                  return <span key={index}>{part}</span>;
                }
                
                return (
                  <span key={index}>
                    {part}
                    <span className="px-2 py-1 mx-1 bg-muted rounded-md min-w-20 inline-block text-center">
                      {showAnswer ? correctAnswer : '______'}
                    </span>
                  </span>
                );
              })}
            </p>
          </TabsContent>
          <TabsContent value="english" className="pt-4">
            <p className="text-lg leading-relaxed">{translation}</p>
          </TabsContent>
        </Tabs>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((option) => (
            <Button
              key={option}
              variant={showAnswer 
                ? option === correctAnswer 
                  ? "default" 
                  : option === selectedOption 
                    ? "destructive" 
                    : "outline"
                : selectedOption === option 
                  ? "default" 
                  : "outline"
              }
              className={cn(
                "justify-start h-auto py-3 px-4 font-japanese",
                showAnswer && option === correctAnswer && "ring-2 ring-primary"
              )}
              onClick={() => handleOptionSelect(option)}
              disabled={answered}
            >
              <span className="flex-1 text-left">{option}</span>
              {showAnswer && option === correctAnswer && (
                <CheckIcon className="h-4 w-4 text-primary ml-2" />
              )}
              {showAnswer && option === selectedOption && option !== correctAnswer && (
                <XIcon className="h-4 w-4 text-destructive ml-2" />
              )}
            </Button>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          {!answered ? (
            <Button 
              onClick={handleSubmit} 
              disabled={!selectedOption}
              className="min-w-24"
            >
              Check Answer
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              className="min-w-24"
            >
              Next <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}