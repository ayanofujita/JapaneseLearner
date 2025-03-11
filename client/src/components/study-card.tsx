import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SavedWord } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface StudyCardProps {
  word: SavedWord;
  onComplete: () => void;
}

export default function StudyCard({ word, onComplete }: StudyCardProps) {
  const [showAnswer, setShowAnswer] = useState(false);

  const { mutate } = useMutation({
    mutationFn: async (confidence: number) => {
      // Calculate next review date based on confidence and review count
      const days = confidence * (word.reviewCount + 1);
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + days);

      const res = await apiRequest("PATCH", `/api/words/${word.id}/review`, {
        nextReview: nextReview.toISOString()
      });
      return res.json();
    },
    onSuccess: onComplete
  });

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">{word.word}</h3>
          {showAnswer && (
            <>
              <p className="text-lg mb-2">{word.reading}</p>
              <p className="text-muted-foreground">{word.meaning}</p>
              {word.context && (
                <p className="text-sm text-muted-foreground mt-4 italic">
                  Context: {word.context}
                </p>
              )}
            </>
          )}
        </div>

        {!showAnswer ? (
          <Button
            className="w-full"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </Button>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              onClick={() => mutate(1)}
            >
              Hard
            </Button>
            <Button
              variant="outline"
              onClick={() => mutate(2)}
            >
              Good
            </Button>
            <Button
              variant="outline"
              onClick={() => mutate(3)}
            >
              Easy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
