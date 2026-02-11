import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import SpeciesListWithSearch from "./species-list-with-search";

export default async function SpeciesList() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const sessionId = session.user.id;

  const { data: species } = await supabase
    .from("species")
    .select("*, profiles!author(display_name, email)")
    .order("id", { ascending: false });

  return <SpeciesListWithSearch species={species ?? []} sessionId={sessionId} />;
}
