import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, XIcon, ChevronDownIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DictionaryPopupProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

interface WordData {
  reading?: string;
  meaning?: string;
  partsOfSpeech?: string[];
  examples?: string[];
}

export default function DictionaryPopup({ word, position, onClose }: DictionaryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isKanjiOpen, setIsKanjiOpen] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

  const { data: wordData, isLoading } = useQuery({
    queryKey: ["/api/dictionary", word],
    queryFn: async () => {
      const res = await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error("Failed to fetch word data");
      const data = await res.json();

      if (!data.data?.[0]) return null;

      const entry = data.data[0];
      return {
        reading: entry.japanese[0]?.reading || "",
        meaning: entry.senses[0]?.english_definitions.join("; "),
        partsOfSpeech: entry.senses[0]?.parts_of_speech,
        examples: entry.senses[0]?.info || []
      };
    }
  });

  const { mutate: saveWord } = useMutation({
    mutationFn: async (data: { word: string; reading: string; meaning: string }) => {
      const res = await apiRequest("POST", "/api/words", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Word saved",
        description: "Word has been added to your study list"
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
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 50,
    width: 300,
    maxHeight: 400,
    overflowY: 'auto' as const
  };

  return (
    <Card ref={popupRef} style={popupStyle} className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">{word}</h3>
          {wordData?.reading && (
            <p className="text-sm text-muted-foreground">{wordData.reading}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading dictionary data...</p>
        ) : wordData ? (
          <>
            {wordData.partsOfSpeech && (
              <p className="text-xs text-muted-foreground">
                {wordData.partsOfSpeech.join(", ")}
              </p>
            )}
            <p className="text-sm">{wordData.meaning}</p>

            <Collapsible open={isKanjiOpen} onOpenChange={setIsKanjiOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex justify-between items-center"
                >
                  <span>Kanji Details</span>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${isKanjiOpen ? 'transform rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-2 space-y-2">
                <p className="text-sm">Kanji details coming soon...</p>
              </CollapsibleContent>
            </Collapsible>

            {wordData.examples && wordData.examples.length > 0 && (
              <Collapsible open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex justify-between items-center"
                  >
                    <span>Example Sentences</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExamplesOpen ? 'transform rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-2">
                  {wordData.examples.map((example, i) => (
                    <p key={i} className="text-sm">{example}</p>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                if (wordData.reading && wordData.meaning) {
                  saveWord({
                    word,
                    reading: wordData.reading,
                    meaning: wordData.meaning
                  });
                }
              }}
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Save for Study
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No dictionary data found</p>
        )}
      </div>
    </Card>
  );
}