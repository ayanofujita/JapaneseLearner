import { useQuery, useMutation } from "@tanstack/react-query";
import StudyCard from "@/components/study-card";
import Quiz from "@/components/quiz";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2Icon, BookOpenCheck, FlaskConical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { SavedWord } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export default function Study() {
  const { toast } = useToast();
  const [wordToDelete, setWordToDelete] = useState<SavedWord | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const { data: words = [], refetch } = useQuery<SavedWord[]>({
    queryKey: ["/api/words"],
  });

  const { mutate: deleteWord } = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/words/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete word");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Word deleted",
        description: "Word has been removed from your study list",
      });
      refetch();
      setWordToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete word",
        variant: "destructive",
      });
      setWordToDelete(null);
    },
  });

  const dueWords = words.filter((word) =>
    word.nextReview ? new Date(word.nextReview) <= new Date() : true,
  );

  // Filter out words that are due for review from the all words list
  const nonDueWords = words.filter(
    (word) => !dueWords.some((dueWord) => dueWord.id === word.id),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Study</h1>
        <p className="text-muted-foreground">
          Review your saved Japanese vocabulary and test your knowledge with quizzes.
        </p>
      </div>
      
      <Tabs defaultValue="flashcards" className="w-full">
        <TabsList className="w-full md:w-auto inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="flashcards" className="flex items-center data-[state=active]:bg-background data-[state=active]:text-foreground">
            <BookOpenCheck className="mr-2 h-4 w-4" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center data-[state=active]:bg-background data-[state=active]:text-foreground">
            <FlaskConical className="mr-2 h-4 w-4" />
            Quiz
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="flashcards" className="space-y-6 pt-6">
          {dueWords.length > 0 ? (
            <div className="space-y-4">
              {currentCardIndex < dueWords.length && (
                <StudyCard
                  key={dueWords[currentCardIndex].id}
                  word={dueWords[currentCardIndex]}
                  onComplete={() => {
                    refetch();
                    if (currentCardIndex < dueWords.length - 1) {
                      setCurrentCardIndex(currentCardIndex + 1);
                    }
                  }}
                />
              )}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                No words due for review. Come back later or add more words from the
                translator.
              </p>
            </Card>
          )}

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">All Saved Words</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {nonDueWords.map((word) => (
                <Card key={word.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold mb-1">{word.word}</h3>
                      <p className="text-sm text-muted-foreground">
                        {word.reading} · {word.meaning}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Next review:{" "}
                        {word.nextReview
                          ? new Date(word.nextReview).toLocaleDateString()
                          : "Not scheduled"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setWordToDelete(word)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="quiz" className="pt-6">
          <Quiz />
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={!!wordToDelete}
        onOpenChange={(open) => !open && setWordToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Word</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{wordToDelete?.word}" from your
              study list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => wordToDelete && deleteWord(wordToDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
