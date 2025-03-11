import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TranslationForm from "@/components/translation-form";
import JapaneseText from "@/components/japanese-text";
import { Card } from "@/components/ui/card";
import type { Translation } from "@shared/schema";

export default function Home() {
  const [currentTranslation, setCurrentTranslation] = useState<Translation | null>(null);

  const { data: translations = [] } = useQuery<Translation[]>({
    queryKey: ["/api/translations"],
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Japanese Translation</h1>
        <p className="text-muted-foreground">
          Translate English text to Japanese with customizable tone and interactive reading features.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <TranslationForm onTranslate={setCurrentTranslation} />
        </div>

        <div className="space-y-4">
          {currentTranslation && (
            <JapaneseText text={currentTranslation.japaneseText} />
          )}
        </div>
      </div>

      {translations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Translation History</h2>
          <div className="space-y-4">
            {translations.map((translation: Translation) => (
              <Card key={translation.id} className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  {new Date(translation.createdAt!).toLocaleDateString()}
                  {" · "}
                  {translation.tone} tone
                </p>
                <p className="mb-2">{translation.englishText}</p>
                <JapaneseText text={translation.japaneseText} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}