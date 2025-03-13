import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import JapaneseText from "@/components/japanese-text";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Translation } from "@shared/schema";
import { Link } from "wouter";
import ImagePreview from "@/components/image-preview";

export default function History() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: translations = [], isLoading } = useQuery<Translation[]>({
    queryKey: ["/api/translations"],
    select: (data) => {
      // Sort translations by most recent first
      let filteredData = [...data].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Filter by selected tags if any are selected
      if (selectedTags.length > 0) {
        filteredData = filteredData.filter((translation) =>
          selectedTags.every((tag) => translation.tags?.includes(tag))
        );
      }

      return filteredData;
    },
  });

  // Get unique tags from all translations
  const allTags = [...new Set(translations.flatMap((t) => t.tags || []))];

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

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Translation History</h1>
          <p className="text-muted-foreground">
            Your previous Japanese translations
          </p>
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Filter by tags:</h2>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleTag(tag)}
                className="rounded-full"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading translations...</div>
      ) : translations.length === 0 ? (
        <div className="text-center py-8">
          <p>You don't have any translations yet.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Create your first translation</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {translations.map((translation: Translation) => (
            <Card key={translation.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {translation.title || "Untitled"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">
                      {new Date(translation.createdAt).toLocaleDateString()}{" "}
                      {new Date(translation.createdAt).toLocaleTimeString()}
                      {" · "}
                      {translation.tone} tone
                    </p>
                    {translation.tags && translation.tags.length > 0 && (
                      <div className="flex gap-1">
                        {translation.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-primary/10 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleDeleteTranslation(translation.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Translation</p>
                  <JapaneseText 
                    text={translation.japaneseText} 
                    englishText={translation.englishText} 
                  />
                </div>

                {translation.images && translation.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {translation.images.map((image, index) => (
                      <ImagePreview key={index} src={image} index={index} />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}