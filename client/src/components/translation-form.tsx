import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { translateRequestSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "./image-upload";

export default function TranslationForm({ onTranslate }: { onTranslate: (result: any) => void }) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(translateRequestSchema),
    defaultValues: {
      text: "",
      tone: "casual" as const,
      title: "",
      images: []
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { text: string; tone: 'casual' | 'formal'; title?: string; images?: string[] }) => {
      const res = await apiRequest("POST", "/api/translate", data);
      return res.json();
    },
    onSuccess: (data) => {
      onTranslate(data);
      toast({
        title: "Translation complete",
        description: "Your text has been translated successfully."
      });
    },
    onError: (error) => {
      console.error("Translation error:", error);

      // Check if this is an authentication error
      const isAuthError = error instanceof Error && 
        (error.message.includes("401") || error.message.toLowerCase().includes("authentication"));

      toast({
        variant: "destructive",
        title: isAuthError ? "Login Required" : "Translation Failed",
        description: isAuthError 
          ? "Please sign up or log in to translate text."
          : (error instanceof Error ? error.message : "Failed to translate text"),
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter a title or leave blank for AI-generated title"
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images (Optional)</FormLabel>
              <FormControl>
                <ImageUpload
                  images={field.value || []}
                  onImagesChange={(images) => field.onChange(images)}
                  maxImages={4}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text to Translate</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter English text to translate to Japanese..."
                  {...field}
                  rows={5}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tone</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="casual" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Casual (友達と話すように)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="formal" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Formal (丁寧な話し方)
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Translating..." : "Translate"}
        </Button>
      </form>
    </Form>
  );
}