
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, XIcon, LoaderIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DictionaryPopupProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

interface DictionaryEntry {
  reading: string;
  meaning: string;
}

export default function DictionaryPopup({ word, position, onClose }: DictionaryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [dictionaryData, setDictionaryData] = useState<DictionaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dictionary data when component mounts
  useEffect(() => {
    async function fetchDictionaryData() {
      try {
        setIsLoading(true);
        // In a real implementation, you would have an API endpoint to fetch dictionary data
        // For now, simulate a dictionary lookup with a timeout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Example dictionary entry - in a real app, this would come from an API
        setDictionaryData({
          reading: word.length > 2 ? word.substring(0, 2) + "～" : word,
          meaning: "Loading dictionary data..."
        });
      } catch (err) {
        setError("Failed to fetch dictionary data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDictionaryData();
  }, [word]);

  const { mutate: saveWord, isError } = useMutation({
    mutationFn: async (data: { word: string; reading: string; meaning: string }) => {
      const res = await apiRequest("POST", "/api/words", data);
      if (!res.ok) {
        throw new Error('Failed to save word');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Word saved",
        description: "Word has been added to your study list"
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving word",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Calculate position to keep popup in viewport
  const popupStyle = {
    position: "fixed" as const,
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.min(position.y, window.innerHeight - 200),
    zIndex: 50,
    width: 300,
    maxHeight: 400,
    overflowY: 'auto' as const
  };

  return (
    <Card ref={popupRef} style={popupStyle} className="p-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold">{word}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center space-x-2 py-2">
            <LoaderIcon className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading dictionary data...</p>
          </div>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <>
            <div className="mb-2">
              <div className="text-sm font-medium">Reading</div>
              <p className="text-sm">{dictionaryData?.reading || "Unknown"}</p>
            </div>
            <div className="mb-4">
              <div className="text-sm font-medium">Meaning</div>
              <p className="text-sm">{dictionaryData?.meaning || "Unknown"}</p>
            </div>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={isLoading || !dictionaryData}
          onClick={() => {
            if (dictionaryData) {
              saveWord({
                word,
                reading: dictionaryData.reading,
                meaning: dictionaryData.meaning
              });
            }
          }}
        >
          <BookmarkIcon className="h-4 w-4 mr-2" />
          Save for Study
        </Button>
      </div>
    </Card>
  );
}
