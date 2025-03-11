import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DictionaryPopup from "./dictionary-popup";

export default function JapaneseText({ text }: { text: string }) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showFurigana, setShowFurigana] = useState(true);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);

  const handleWordClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;

    // Remove highlight from previously selected word
    if (selectedElement) {
      selectedElement.classList.remove("bg-primary/10");
    }

    // Find the closest ruby element (word container)
    const rubyElement = target.closest('ruby');
    if (rubyElement) {
      // Extract the full word including hiragana/katakana
      const word = rubyElement.textContent || '';
      setSelectedWord(word);
      setPopupPosition({
        x: event.clientX,
        y: event.clientY
      });

      // Add highlight to the new selected word
      rubyElement.classList.add("bg-primary/10");
      setSelectedElement(rubyElement);
    }
  };

  return (
    <Card className="p-6 relative">
      <div className="flex items-center justify-end space-x-2 mb-4">
        <Switch
          id="furigana-mode"
          checked={showFurigana}
          onCheckedChange={setShowFurigana}
        />
        <Label htmlFor="furigana-mode">Show Furigana</Label>
      </div>

      <div
        className={`text-lg leading-relaxed break-words ${!showFurigana ? '[&_rt]:hidden' : ''}`}
        onClick={handleWordClick}
        dangerouslySetInnerHTML={{ __html: text }}
      />

      {selectedWord && popupPosition && (
        <DictionaryPopup
          word={selectedWord}
          position={popupPosition}
          onClose={() => {
            setSelectedWord(null);
            setPopupPosition(null);
            if (selectedElement) {
              selectedElement.classList.remove("bg-primary/10");
              setSelectedElement(null);
            }
          }}
        />
      )}
    </Card>
  );
}