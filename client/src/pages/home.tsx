import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TranslationForm from "@/components/translation-form";
import JapaneseText from "@/components/japanese-text";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import type { Translation } from "@shared/schema";

export default function Home() {
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Japanese Translation</h1>
          <p className="text-muted-foreground">
            Translate English text to Japanese with customizable tone and interactive reading features.
          </p>
        </div>
        <Link to="/history">
          <Button variant="outline">View History</Button>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <TranslationForm onTranslate={setCurrentTranslation} />
        </div>

        <div className="space-y-4">
          {currentTranslation && (
            <>
              <h2 className="font-medium text-lg">{currentTranslation.title || "Translation"}</h2>
              <JapaneseText text={currentTranslation.japaneseText} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}