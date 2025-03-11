import { useState } from "react";
import { Card } from "@/components/ui/card";
import DictionaryPopup from "./dictionary-popup";

export default function JapaneseText({ text }: { text: string }) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  const handleWordClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'RUBY' || target.parentElement?.tagName === 'RUBY') {
      const word = target.closest('ruby')?.textContent || '';
      setSelectedWord(word);
      setPopupPosition({
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  return (
    <Card className="p-6 relative">
      <div
        className="text-lg leading-relaxed break-words"
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
          }}
        />
      )}
    </Card>
  );
}
