import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { translateRequestSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export default function TranslationForm({ onTranslate }: { onTranslate: (result: any) => void }) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(translateRequestSchema),
    defaultValues: {
      text: "",
      tone: "casual" as const
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: { text: string; tone: 'casual' | 'formal' }) => {
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
      toast({
        title: "Translation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data))} className="space-y-6">
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>English Text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter text to translate..."
                  className="min-h-[200px]"
                  {...field}
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
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="casual" id="casual" />
                    <label htmlFor="casual">Casual</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="formal" id="formal" />
                    <label htmlFor="formal">Formal</label>
                  </div>
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
