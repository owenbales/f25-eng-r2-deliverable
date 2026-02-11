"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TypographyH2 } from "@/components/ui/typography";
import type { Database } from "@/lib/schema";
import { useMemo, useState } from "react";
import AddSpeciesDialog from "./add-species-dialog";
import SpeciesCard from "./species-card";

type SpeciesRow = Database["public"]["Tables"]["species"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SpeciesWithAuthor = SpeciesRow & {
  profiles: Pick<ProfileRow, "display_name" | "email"> | null;
};

export default function SpeciesListWithSearch({
  species,
  sessionId,
}: {
  species: SpeciesWithAuthor[];
  sessionId: string;
}) {
  const [search, setSearch] = useState("");

  const filteredSpecies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return species;
    return species.filter(
      (s) =>
        s.scientific_name.toLowerCase().includes(query) ||
        (s.common_name?.toLowerCase().includes(query) ?? false) ||
        (s.description?.toLowerCase().includes(query) ?? false),
    );
  }, [species, search]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TypographyH2>Species List</TypographyH2>
        <AddSpeciesDialog userId={sessionId} />
      </div>
      <Separator className="my-4" />
      <div className="mb-4">
        <Label htmlFor="species-search" className="sr-only">
          Search species by scientific name, common name, or description
        </Label>
        <Input
          id="species-search"
          type="search"
          placeholder="Search by scientific name, common name, or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      <div className="flex flex-wrap justify-center">
        {filteredSpecies.map((s) => (
          <SpeciesCard key={s.id} species={s} userId={sessionId} />
        ))}
      </div>
    </>
  );
}
