import { useState, useRef, useEffect } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface TagInputProps {
  existingTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({
  existingTags,
  selectedTags,
  onChange,
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter tags that match the input and aren't already selected
  const filteredTags = existingTags.filter(
    (tag) =>
      !selectedTags.includes(tag) &&
      (inputValue === "" ||
        tag.toLowerCase().includes(inputValue.toLowerCase())),
  );

  // Add a new tag
  const addTag = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !selectedTags.includes(trimmedValue)) {
      onChange([...selectedTags, trimmedValue]);
      setInputValue("");
    }
  };

  // Remove a tag
  const removeTag = (index: number) => {
    const newTags = [...selectedTags];
    newTags.splice(index, 1);
    onChange(newTags);
  };

  // Focus the input when the popover opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full"
          >
            <span className="text-sm">{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              className="text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        ))}

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1 px-2">
              <PlusIcon className="h-4 w-4" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput
                ref={inputRef}
                placeholder="Search or create tag..."
                value={inputValue}
                onValueChange={setInputValue}
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) {
                    e.preventDefault();
                    addTag(inputValue);
                    if (filteredTags.length === 0) {
                      setIsOpen(false);
                    }
                  }
                }}
              />

              <CommandEmpty>
                {inputValue && (
                  <div
                    className="px-2 py-3 text-sm cursor-pointer hover:bg-accent flex items-center"
                    onClick={() => {
                      addTag(inputValue);
                      setIsOpen(false);
                    }}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create tag "{inputValue}"
                  </div>
                )}
              </CommandEmpty>

              <CommandGroup
                heading={inputValue ? "Matching Tags" : "Available Tags"}
              >
                {filteredTags.length > 0
                  ? filteredTags.map((tag) => (
                      <CommandItem
                        key={tag}
                        value={tag}
                        onSelect={(value) => {
                          addTag(value);
                          setInputValue("");
                        }}
                      >
                        {tag}
                      </CommandItem>
                    ))
                  : inputValue === "" && (
                      <p className="py-2 px-2 text-sm text-muted-foreground">
                        No available tags
                      </p>
                    )}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
