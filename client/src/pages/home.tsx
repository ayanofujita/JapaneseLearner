import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TranslationForm from "@/components/translation-form";
import JapaneseText from "@/components/japanese-text";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Translation } from "@shared/schema";

export default function Home() {
  const [currentTranslation, setCurrentTranslation] =
    useState<Translation | null>(null);
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Japanese Translation</h1>
          <p className="text-muted-foreground">
            Translate English text to Japanese with customizable tone and
            interactive reading features.
          </p>
        </div>
        {/* <Link to="/history">
          <Button variant="outline">View History</Button>
        </Link> */}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <TranslationForm onTranslate={setCurrentTranslation} />
        </div>

        <div>
          {currentTranslation && (
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{currentTranslation.title}</h2>

              {/* Show images if they exist */}
              {currentTranslation.images && currentTranslation.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {currentTranslation.images.map((image, index) => (
                    <div key={index} className="aspect-square">
                      <img
                        src={image}
                        alt={`Image ${index + 1}`}
                        className="h-full w-full rounded-lg object-cover border border-muted"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-muted p-6 rounded-lg">
                <JapaneseText
                  text={currentTranslation.japaneseText}
                  englishText={currentTranslation.englishText}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}