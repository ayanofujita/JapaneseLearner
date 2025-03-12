import { useState } from "react";
import DictionaryPopup from "./dictionary-popup";

interface JapaneseTextProps {
  text: string;
  showFurigana?: boolean;
}

export default function JapaneseText({ text, showFurigana = true }: JapaneseTextProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  const handleWordClick = (e: React.MouseEvent, word: string) => {
    // Don't show popup for punctuation marks
    if (/^[、。！？]+$/.test(word)) return;

    setSelectedWord(word);
    const rect = e.currentTarget.getBoundingClientRect();
    setPopupPosition({
      x: rect.left,
      y: rect.bottom + window.scrollY
    });
    e.stopPropagation();
  };

  const handleClosePopup = () => {
    setSelectedWord(null);
  };

  const handleContainerClick = () => {
    setSelectedWord(null);
  };

  // Process text to handle furigana toggling
  const processedText = showFurigana 
    ? text 
    : text.replace(/<ruby>(.*?)\|.*?<\/ruby>/g, '$1')
          .replace(/<ruby>(.*?)<rt>.*?<\/rt><\/ruby>/g, '$1');

  // Instead of rendering text as components, use dangerouslySetInnerHTML
  // to properly render the HTML tags, but add click handlers via event delegation
  return (
    <div className="relative">
      <div 
        className={`leading-loose ${showFurigana ? '' : 'no-furigana'}`}
        onClick={(e) => {
          // Use event delegation to handle clicks
          const target = e.target as HTMLElement;

          // If clicking on a word within a ruby tag or a span with jp-word class
          if (target.closest('ruby') || target.classList.contains('jp-word')) {
            const word = target.textContent || '';
            if (word.trim() !== '') {
              handleWordClick(e, word);
            }
            return;
          }

          // Otherwise, close any popup
          handleContainerClick();
        }}
        dangerouslySetInnerHTML={{ __html: processedText }}
      />

      {selectedWord && (
        <DictionaryPopup
          word={selectedWord}
          position={popupPosition}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
}