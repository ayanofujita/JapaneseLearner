import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Translation } from "@shared/schema";

interface TranslationFormProps {
  onTranslate: (translation: Translation) => void;
}

const formSchema = z.object({
  text: z.string().min(1, "Text is required"),
  tone: z.enum(["casual", "formal", "humble", "honorific"]),
});

export default function TranslationForm({ onTranslate }: TranslationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      tone: "casual",
    },
  });

  const translationMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/translate", values);
      return res.json();
    },
    onSuccess: (data: Translation) => {
      toast({
        title: "Translation successful",
        description: "Your text has been translated to Japanese.",
      });

      // Call the original onTranslate for compatibility
      onTranslate(data);

      // Redirect to the reader page with the translation data
      const params = new URLSearchParams({
        id: data.id.toString(),
        text: data.japaneseText,
        english: data.englishText,
        tone: data.tone
      });

      navigate(`/reader?${params.toString()}`);
      form.reset();
    },
    onError: (error) => {
      console.error("Translation error:", error);
      toast({
        title: "Translation failed",
        description:
          "There was an error translating your text. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    translationMutation.mutate(values, {
      onSettled: () => setIsLoading(false),
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>English Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the text you want to translate"
                  className="h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="humble">Humble</SelectItem>
                  <SelectItem value="honorific">Honorific</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Translating..." : "Translate"}
        </Button>
      </form>
    </Form>
  );
}