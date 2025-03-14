import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, XIcon, ChevronDownIcon } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import KanjiStrokeAnimation from "@/components/kanji-stroke-animation";
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
  reading: string;
  meaning: string;
  partsOfSpeech: string[];
  examples: Array<{
    japanese: string;
    english: string;
  }>;
}

interface KanjiDetails {
  kanji: string;
  grade?: number;
  stroke_count: number;
  meanings: string[];
  kun_readings: string[];
  on_readings: string[];
  name_readings: string[];
  jlpt?: number;
  unicode: string;
}

function extractKanji(text: string): string[] {
  return Array.from(text).filter((char) => {
    const code = char.charCodeAt(0);
    return code >= 0x4e00 && code <= 0x9fff;
  });
}

export default function DictionaryPopup({
  word,
  position,
  onClose,
}: DictionaryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isKanjiOpen, setIsKanjiOpen] = useState(false);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  const [selectedKanji, setSelectedKanji] = useState<string[]>(
    extractKanji(word),
  );

  const { data: wordData, isLoading } = useQuery<WordData | null>({
    queryKey: ["/api/dictionary", word],
    queryFn: async () => {
      const res = await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error("Failed to fetch word data");
      const data = await res.json();

      if (!data.data?.[0]) return null;

      const entry = data.data[0];
      return {
        reading: entry.japanese[0]?.reading || "",
        meaning: entry.senses[0]?.english_definitions.join("; ") || "",
        partsOfSpeech: entry.senses[0]?.parts_of_speech || [],
        examples: entry.senses[0]?.examples || [],
      };
    },
  });

  const { data: kanjiDetails, isLoading: isLoadingKanji } = useQuery<
    Record<string, KanjiDetails>
  >({
    queryKey: ["/api/kanji", selectedKanji],
    queryFn: async () => {
      const details: Record<string, KanjiDetails> = {};
      await Promise.all(
        selectedKanji.map(async (kanji) => {
          const res = await fetch(`/api/kanji/${encodeURIComponent(kanji)}`);
          if (res.ok) {
            details[kanji] = await res.json();
          }
        }),
      );
      return details;
    },
    enabled: selectedKanji.length > 0 && isKanjiOpen,
  });

  const { mutate: saveWord } = useMutation({
    mutationFn: async (data: {
      word: string;
      reading: string;
      meaning: string;
    }) => {
      const res = await apiRequest("POST", "/api/words", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to save word");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.message === "Word already saved") {
        toast({
          title: "Word already saved",
          description: "This word is already in your study list",
        });
      } else {
        toast({
          title: "Word saved",
          description: "Word has been added to your study list",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save word",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const popupStyle = isMobile
    ? {
        position: "fixed" as const,
        left: "50%" as const,
        top: "50%" as const,
        transform: "translate(-50%, -50%)" as const,
        zIndex: 50,
        width: "90%" as const,
        maxWidth: "400px",
        maxHeight: "80vh",
        overflowY: "auto" as const,
      }
    : {
        position: "fixed" as const,
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y, window.innerHeight - 400),
        zIndex: 50,
        width: 300,
        maxHeight: 400,
        overflowY: "auto" as const,
      };

  return (
    <Card
      ref={popupRef}
      style={popupStyle}
      className={`p-4 ${isMobile ? "shadow-lg" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-2">
          <h3 className="text-lg font-bold break-all">{word}</h3>
          {wordData?.reading && (
            <p className="text-sm text-muted-foreground">{wordData.reading}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={onClose}
        >
          <XIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading dictionary data...
          </p>
        ) : wordData ? (
          <>
            {wordData.partsOfSpeech.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {wordData.partsOfSpeech.join(", ")}
              </p>
            )}
            <p className="text-sm">{wordData.meaning}</p>

            {selectedKanji.length > 0 && (
              <Collapsible open={isKanjiOpen} onOpenChange={setIsKanjiOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex justify-between items-center"
                  >
                    <span>Kanji Details</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${isKanjiOpen ? "transform rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-4">
                  {isLoadingKanji ? (
                    <p className="text-sm">Loading kanji details...</p>
                  ) : kanjiDetails ? (
                    selectedKanji.map((kanji) => {
                      const details = kanjiDetails[kanji];
                      if (!details) return null;

                      return (
                        <div
                          key={kanji}
                          className="border rounded p-2 space-y-2"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-2xl font-bold">{kanji}</span>
                            <div className="text-xs text-muted-foreground">
                              <div>Strokes: {details.stroke_count}</div>
                              {details.grade && (
                                <div>Grade: {details.grade}</div>
                              )}
                              {details.jlpt && <div>JLPT N{details.jlpt}</div>}
                            </div>
                          </div>

                          {/* Kanji Stroke Animation */}
                          <div className="flex justify-center py-2">
                            <KanjiStrokeAnimation
                              key={`${kanji}-stroke`}
                              kanji={kanji}
                              size={100}
                              strokeColor="currentColor"
                              strokeWidth={2.5}
                              animationDuration={1.2}
                            />
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium">Meanings:</p>
                            <p className="text-sm">
                              {details.meanings.join(", ")}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <p className="text-sm font-medium">Readings:</p>
                            {details.on_readings.length > 0 && (
                              <p className="text-sm">
                                On: {details.on_readings.join(", ")}
                              </p>
                            )}
                            {details.kun_readings.length > 0 && (
                              <p className="text-sm">
                                Kun: {details.kun_readings.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm">No kanji details available</p>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}

            {wordData.examples.length > 0 && (
              <Collapsible
                open={isExamplesOpen}
                onOpenChange={setIsExamplesOpen}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex justify-between items-center"
                  >
                    <span>Example Sentences</span>
                    <ChevronDownIcon
                      className={`h-4 w-4 transition-transform ${isExamplesOpen ? "transform rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-2 space-y-2">
                  {wordData.examples.map((example, index) => (
                    <div key={index} className="text-sm space-y-1">
                      <p className="font-medium">{example.japanese}</p>
                      <p className="text-muted-foreground">{example.english}</p>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => {
                if (wordData?.reading && wordData?.meaning) {
                  saveWord({
                    word,
                    reading: wordData.reading,
                    meaning: wordData.meaning,
                  });
                }
              }}
            >
              <BookmarkIcon className="h-4 w-4 mr-2" />
              Save for Study
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No dictionary data found
          </p>
        )}
      </div>
    </Card>
  );
}