import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TranslationForm from "@/components/translation-form";
import JapaneseText from "@/components/japanese-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Translation } from "@shared/schema";

export default function Home() {
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: translations = [] } = useQuery<Translation[]>({
    queryKey: ["/api/translations"],
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/translations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/translations"] });
      toast({
        title: "Translation deleted",
        description: "The translation has been removed successfully.",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete the translation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteTranslation = (id: number) => {
    if (confirm("Are you sure you want to delete this translation?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Japanese Translation</h1>
        <p className="text-muted-foreground">
          Translate English text to Japanese with customizable tone and interactive reading features.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <TranslationForm onTranslate={setCurrentTranslation} />
        </div>

        <div className="space-y-4">
          {currentTranslation && (
            <JapaneseText text={currentTranslation.japaneseText} />
          )}
        </div>
      </div>

      {translations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Translation History</h2>
          <div className="space-y-4">
            {translations.map((translation: Translation) => (
              <Card key={translation.id} className="p-4">
                <div className="flex justify-between items-start">
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(translation.createdAt!).toLocaleDateString()}
                    {" · "}
                    {translation.tone} tone
                  </p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => handleDeleteTranslation(translation.id)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
                <p className="mb-2">{translation.englishText}</p>
                <JapaneseText text={translation.japaneseText} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}