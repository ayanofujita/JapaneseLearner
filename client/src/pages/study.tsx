import { useQuery } from "@tanstack/react-query";
import StudyCard from "@/components/study-card";
import { Card } from "@/components/ui/card";
import type { SavedWord } from "@shared/schema";

export default function Study() {
  const { data: words = [], refetch } = useQuery<SavedWord[]>({
    queryKey: ["/api/words"],
  });

  const dueWords = words.filter(word => 
    word.nextReview ? new Date(word.nextReview) <= new Date() : true
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Study</h1>
        <p className="text-muted-foreground">
          Review your saved Japanese vocabulary using spaced repetition.
        </p>
      </div>

      {dueWords.length > 0 ? (
        <StudyCard
          word={dueWords[0]}
          onComplete={() => refetch()}
        />
      ) : (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            No words due for review. Come back later or add more words from the translator.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">All Saved Words</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {words.map(word => (
            <Card key={word.id} className="p-4">
              <h3 className="font-bold mb-1">{word.word}</h3>
              <p className="text-sm text-muted-foreground">
                {word.reading} · {word.meaning}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Next review: {word.nextReview ? new Date(word.nextReview).toLocaleDateString() : 'Not scheduled'}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}