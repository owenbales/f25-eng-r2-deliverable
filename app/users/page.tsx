import { Separator } from "@/components/ui/separator";
import { TypographyH2 } from "@/components/ui/typography";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";

export default async function UsersPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, display_name, biography")
    .order("display_name", { ascending: true });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TypographyH2>Users</TypographyH2>
      </div>
      <Separator className="my-4" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles?.map((profile) => (
          <div
            key={profile.id}
            className="rounded-lg border-2 border-border bg-card p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold">{profile.display_name}</h3>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            {profile.biography ? (
              <p className="mt-2 text-sm">{profile.biography}</p>
            ) : (
              <p className="mt-2 text-muted-foreground text-sm italic">No biography</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
