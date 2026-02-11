"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary";
const WIKIPEDIA_OPENSEARCH_URL = "https://en.wikipedia.org/w/api.php";

async function fetchWikipediaSummary(searchQuery: string): Promise<{ extract: string; thumbnailUrl: string | null } | null> {
  const encodedQuery = encodeURIComponent(searchQuery.trim());
  const searchRes = await fetch(
    `${WIKIPEDIA_OPENSEARCH_URL}?action=opensearch&search=${encodedQuery}&limit=1&format=json&origin=*`,
  );
  if (!searchRes.ok) return null;
  const searchJson: unknown = await searchRes.json();
  const titles = Array.isArray(searchJson) && Array.isArray(searchJson[1]) ? searchJson[1] : [];
  const title = titles[0];
  if (!title || typeof title !== "string") return null;

  const summaryTitle = encodeURIComponent(title.replace(/ /g, "_"));
  const summaryRes = await fetch(`${WIKIPEDIA_SUMMARY_URL}/${summaryTitle}`);
  if (!summaryRes.ok) return null;
  const summary = (await summaryRes.json()) as {
    extract?: string;
    thumbnail?: { source?: string; uri?: string };
  };
  const extract = typeof summary.extract === "string" ? summary.extract : null;
  if (!extract) return null;
  const thumbnailUrl =
    summary.thumbnail?.source ?? summary.thumbnail?.uri ?? null;
  return { extract, thumbnailUrl };
}

const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  endangered: z.boolean().nullable(),
});

type FormData = z.infer<typeof speciesSchema>;

const defaultValues: Partial<FormData> = {
  scientific_name: "",
  common_name: null,
  kingdom: "Animalia",
  total_population: null,
  image: null,
  description: null,
  endangered: null,
};

export default function AddSpeciesDialog({ userId }: { userId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [wikiSearchQuery, setWikiSearchQuery] = useState("");
  const [wikiSearching, setWikiSearching] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (input: FormData) => {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").insert([
      {
        author: userId,
        common_name: input.common_name,
        description: input.description,
        endangered: input.endangered,
        kingdom: input.kingdom,
        scientific_name: input.scientific_name,
        total_population: input.total_population,
        image: input.image,
      },
    ]);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    form.reset(defaultValues);
    setOpen(false);
    router.refresh();

    return toast({
      title: "New species added!",
      description: "Successfully added " + input.scientific_name + ".",
    });
  };

  const handleWikipediaSearch = async () => {
    if (!wikiSearchQuery.trim()) return;
    setWikiSearching(true);
    try {
      const result = await fetchWikipediaSummary(wikiSearchQuery);
      if (!result) {
        toast({
          title: "No article found",
          description: "No Wikipedia article matched your search. Try a different scientific or common name.",
          variant: "destructive",
        });
        return;
      }
      form.setValue("description", result.extract);
      if (result.thumbnailUrl) form.setValue("image", result.thumbnailUrl);
      toast({
        title: "Wikipedia data loaded",
        description: "Description and image have been filled from Wikipedia.",
      });
    } catch {
      toast({
        title: "Search failed",
        description: "Could not reach Wikipedia. Please try again.",
        variant: "destructive",
      });
    } finally {
      setWikiSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Icons.add className="mr-3 h-5 w-5" />
          Add Species
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Species</DialogTitle>
          <DialogDescription>
            Add a new species here. Click &quot;Add Species&quot; below when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
            <div className="grid w-full items-center gap-4">
              <div className="space-y-2">
                <FormLabel>Search Wikipedia for species info</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by scientific or common name..."
                    value={wikiSearchQuery}
                    onChange={(e) => setWikiSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleWikipediaSearch();
                    }
                  }}
                    disabled={wikiSearching}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void handleWikipediaSearch()}
                    disabled={wikiSearching}
                  >
                    {wikiSearching ? (
                      <Icons.spinner className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2 sr-only sm:not-sr-only">Search Wikipedia</span>
                  </Button>
                </div>
              </div>
              <FormField
                control={form.control}
                name="scientific_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scientific Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Cavia porcellus" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="common_name"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Common Name</FormLabel>
                      <FormControl>
                        <Input value={value ?? ""} placeholder="Guinea pig" {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="kingdom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kingdom</FormLabel>
                    <Select onValueChange={(value) => field.onChange(kingdoms.parse(value))} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a kingdom" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {kingdoms.options.map((kingdom, index) => (
                            <SelectItem key={index} value={kingdom}>
                              {kingdom}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_population"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Total population</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={value ?? ""}
                          placeholder="300000"
                          {...rest}
                          onChange={(event) => field.onChange(+event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input
                          value={value ?? ""}
                          placeholder="https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/George_the_amazing_guinea_pig.jpg/440px-George_the_amazing_guinea_pig.jpg"
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="endangered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endangered</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "not_set" ? null : value === "yes")
                      }
                      value={field.value === null || field.value === undefined ? "not_set" : field.value ? "yes" : "no"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_set">Not set</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          value={value ?? ""}
                          placeholder="The guinea pig or domestic guinea pig, also known as the cavy or domestic cavy, is a species of rodent belonging to the genus Cavia in the family Caviidae."
                          {...rest}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <div className="flex">
                <Button type="submit" className="ml-1 mr-1 flex-auto">
                  Add Species
                </Button>
                <DialogClose asChild>
                  <Button type="button" className="ml-1 mr-1 flex-auto" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
