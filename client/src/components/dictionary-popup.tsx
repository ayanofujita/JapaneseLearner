import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, XIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DictionaryPopupProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function DictionaryPopup({ word, position, onClose }: DictionaryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        <p className="text-sm text-muted-foreground">Loading dictionary data...</p>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => {
            saveWord({
              word,
              reading: "Example reading",
              meaning: "Example meaning"
            });
          }}
        >
          <BookmarkIcon className="h-4 w-4 mr-2" />
          Save for Study
        </Button>
      </div>
    </Card>
  );
}