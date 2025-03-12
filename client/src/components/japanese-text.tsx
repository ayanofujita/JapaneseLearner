import React, { useState } from "react";
import DictionaryPopup from "./dictionary-popup";

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

  return (
    <div 
      className={`leading-loose ${showFurigana ? '' : 'no-furigana'}`}
      onClick={handleContainerClick}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}sText();

    return (
      <div 
        className="leading-loose" 
        onClick={handleContainerClick}
      >
        {processedText.split(/(<ruby>.*?<\/ruby>|[^\s]+|\s+)/).filter(Boolean).map((part, index) => {
          if (part.trim() === '') {
            return part;
          }

          if (part.startsWith('<ruby>')) {
            // Render the ruby tag as HTML
            return (
              <span 
                key={index} 
                dangerouslySetInnerHTML={{ __html: part }} 
                onClick={(e) => {
                  const content = part.replace(/<[^>]*>/g, '');
                  handleWordClick(e, content.split('|')[0] || content);
                }}
                className="cursor-pointer hover:bg-accent hover:rounded"
              />
            );
          }

          return (
            <span 
              key={index} 
              onClick={(e) => handleWordClick(e, part)}
              className="cursor-pointer hover:bg-accent hover:rounded"
            >
              {part}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative">
      {renderText()}
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