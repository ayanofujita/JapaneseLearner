import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TranslationForm from "@/components/translation-form";
import JapaneseText from "@/components/japanese-text";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Translation } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

function ImagePreview({ src, index }: { src: string; index: number }) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={`Image ${index + 1}`}
        className="h-24 w-24 rounded-lg object-cover border border-muted cursor-pointer" // Reduced size
        onClick={() => setIsEnlarged(true)}
      />
      <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
        <DialogHeader>
          <DialogTitle>Image {index + 1}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <img
            src={src}
            alt={`Image ${index + 1}`}
            className="w-full max-h-[600px] rounded-lg object-contain"
          />
        </DialogContent>
        <DialogFooter>
          <Button variant="default" onClick={() => setIsEnlarged(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default function Home() {
  const [currentTranslation, setCurrentTranslation] =
    useState<Translation | null>(null);
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Japanese Translation</h1>
          <p className="text-muted-foreground">
            Turn your thoughts into Japanese text and practice reading in your
            own context.
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
              <h2 className="text-2xl font-semibold">
                {currentTranslation.title}
              </h2>

              <div className="bg-muted p-6 rounded-lg">
                <JapaneseText
                  text={currentTranslation.japaneseText}
                  englishText={currentTranslation.englishText}
                />
              </div>

              {/* Show images if they exist */}
              {currentTranslation.images &&
                currentTranslation.images.length > 0 && (
                  <div className="flex flex-wrap mt-4">
                    {currentTranslation.images.map((image, index) => (
                      <div key={index} className="mr-2 mb-2">
                        <ImagePreview src={image} index={index} />
                      </div>
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
