"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EditSpeciesDialog from "./edit-species-dialog";

type SpeciesRow = Database["public"]["Tables"]["species"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type SpeciesWithAuthor = SpeciesRow & {
  profiles: Pick<ProfileRow, "display_name" | "email"> | null;
};

export default function SpeciesCard({ species, userId }: { species: SpeciesWithAuthor; userId: string }) {
  const router = useRouter();
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isAuthor = userId === species.author;

  const openEdit = () => {
    setDetailOpen(false);
    setEditOpen(true);
  };

  const openDeleteConfirm = () => {
    setDetailOpen(false);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").delete().eq("id", species.id);
    setIsDeleting(false);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setDeleteConfirmOpen(false);
    router.refresh();
    return toast({
      title: "Species deleted",
      description: species.scientific_name + " has been removed.",
    });
  };

  return (
    <div className="m-4 w-72 min-w-72 flex-none rounded border-2 p-3 shadow">
      {species.image && (
        <div className="relative h-40 w-full">
          <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
        </div>
      )}
      <h3 className="mt-3 text-2xl font-semibold">{species.scientific_name}</h3>
      <h4 className="text-lg font-light italic">{species.common_name}</h4>
      <p>{species.description ? species.description.slice(0, 150).trim() + "..." : ""}</p>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogTrigger asChild>
          <Button className="mt-3 w-full">Learn More</Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{species.scientific_name}</DialogTitle>
            <DialogDescription>Species details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <span className="text-muted-foreground text-sm font-medium">Common name</span>
              <p className="text-base">{species.common_name ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">Kingdom</span>
              <p className="text-base">{species.kingdom}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">Total population</span>
              <p className="text-base">{species.total_population != null ? species.total_population.toLocaleString() : "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">Endangered</span>
              <p className="text-base">
                {species.endangered === null || species.endangered === undefined
                  ? "Not set"
                  : species.endangered
                    ? "Yes"
                    : "No"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">Description</span>
              <p className="text-base">{species.description ?? "—"}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-sm font-medium">Author</span>
              <p className="text-base">
                {species.profiles
                  ? species.profiles.display_name + " (" + species.profiles.email + ")"
                  : "—"}
              </p>
            </div>
            {isAuthor && (
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" onClick={openEdit}>
                  Edit species
                </Button>
                <Button variant="destructive" onClick={openDeleteConfirm}>
                  Delete species
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete species?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {species.scientific_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <EditSpeciesDialog species={species} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}
