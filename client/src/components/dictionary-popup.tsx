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

function KanjiStrokeOrder({ kanji }: { kanji: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSvg = async () => {
      setIsLoading(true);
      setError(null);
      setSvgContent(null);

      try {
        // Convert kanji to unicode for URL
        const code = kanji.charCodeAt(0).toString(16).padStart(5, "0");
        const response = await fetch(
          `https://cdn.jsdelivr.net/npm/@kanji-vg/core@0.2.0/kanji/${code}.svg`,
        );

        if (!response.ok) {
          throw new Error("Failed to load SVG");
        }

        const svg = await response.text();
        // Add a class to the SVG element for easier selection
        const processedSvg = svg.replace(
          "<svg",
          `<svg class="kanji-svg-element"`,
        );
        setSvgContent(processedSvg);
      } catch (error) {
        console.error("Error loading stroke order:", error);
        setError("Failed to load stroke order");
      } finally {
        setIsLoading(false);
      }
    };

    loadSvg();
  }, [kanji]);

  // Effect for animating paths after SVG is loaded into the DOM
  useEffect(() => {
    if (!svgContent || !svgContainerRef.current) return;

    // Use MutationObserver to ensure the SVG is fully rendered in the DOM
    const observer = new MutationObserver(() => {
      const svgElement =
        svgContainerRef.current?.querySelector(".kanji-svg-element");
      if (!svgElement) return;

      // Once we've found the SVG, disconnect the observer
      observer.disconnect();

      // Get all paths within the SVG
      const paths = svgElement.querySelectorAll("path");

      paths.forEach((path, index) => {
        if (path instanceof SVGPathElement) {
          const length = path.getTotalLength();

          // Set the CSS variables on the path itself
          path.style.setProperty("--stroke-length", `${length}px`);
          path.style.strokeDasharray = `${length}px`;
          path.style.strokeDashoffset = `${length}px`;

          // Apply animation with delay based on stroke order
          path.style.animation = `strokeAnimation 1.5s ${index * 0.5}s ease forwards`;
        }
      });
    });

    // Start observing
    observer.observe(svgContainerRef.current, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [svgContent]);

  return (
    <div className="relative">
      <style>
        {`
          @keyframes strokeAnimation {
            from {
              stroke-dashoffset: var(--stroke-length);
            }
            to {
              stroke-dashoffset: 0;
            }
          }
          .kanji-svg {
            background-color: var(--background);
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
          }
          .kanji-svg svg {
            width: 100%;
            height: 100%;
          }
          .kanji-svg path {
            fill: none;
            stroke: currentColor;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
        `}
      </style>
      <div
        ref={svgContainerRef}
        className={`kanji-svg w-32 h-32 mx-auto flex items-center justify-center`}
      >
        {isLoading && (
          <div className="text-sm text-center text-muted-foreground">
            Loading stroke order...
          </div>
        )}

        {error && <div className="text-sm text-red-500">{error}</div>}

        {!isLoading && !error && svgContent && (
          <div dangerouslySetInnerHTML={{ __html: svgContent }} />
        )}
      </div>
    </div>
  );
}

export default function DictionaryPopup({
  word,
  position,
  onClose,
}: DictionaryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
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
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Word saved",
        description: "Word has been added to your study list",
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

  const popupStyle = {
    position: "fixed" as const,
    left: Math.min(position.x, window.innerWidth - 300),
    top: Math.min(position.y, window.innerHeight - 400),
    zIndex: 50,
    width: 300,
    maxHeight: 400,
    overflowY: "auto" as const,
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

                          <KanjiStrokeOrder kanji={kanji} />

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
                if (wordData.reading && wordData.meaning) {
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
