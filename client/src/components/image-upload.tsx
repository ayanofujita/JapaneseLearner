import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ImageUpload({
  images,
  onImagesChange,
  maxImages = 4,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress with 70% quality
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding new files would exceed the limit
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    setUploading(true);
    try {
      const newImages = await Promise.all(
        Array.from(files).map(async (file) => {
          try {
            return await compressImage(file);
          } catch (error) {
            console.error('Failed to compress image:', error);
            throw error;
          }
        })
      );

      onImagesChange([...images, ...newImages]);
    } catch (error) {
      console.error("Failed to upload images:", error);
      alert("Failed to upload one or more images. Please try again with smaller images.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((image, index) => (
          <div key={index} className="relative aspect-square">
            <img
              src={image}
              alt={`Upload ${index + 1}`}
              className="h-full w-full rounded-lg object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute right-1 top-1"
              onClick={() => removeImage(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {images.length < maxImages && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="w-full"
            disabled={uploading}
            asChild
          >
            <label>
              <ImageIcon className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Add Images"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Upload up to {maxImages} images. Support JPG, PNG, GIF. Max size 5MB each.
      </p>
    </div>
  );
}