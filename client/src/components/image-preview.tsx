
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImagePreviewProps {
  src: string;
  index: number;
}

export default function ImagePreview({ src, index }: ImagePreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="aspect-square cursor-pointer hover:opacity-90 transition-opacity">
          <img
            src={src}
            alt={`Image ${index + 1}`}
            className="h-full w-full rounded-lg object-cover"
          />
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80%] p-1">
        <div className="overflow-hidden rounded-lg max-h-[80vh]">
          <img
            src={src}
            alt={`Image ${index + 1} (enlarged)`}
            className="w-full h-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
