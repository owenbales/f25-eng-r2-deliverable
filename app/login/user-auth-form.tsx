"use client";

import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const userAuthSchema = z.object({
  email: z.string().email(),
});

type FormData = z.infer<typeof userAuthSchema>;

export default function UserAuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const supabaseClient = createBrowserSupabaseClient();

  const onSubmit = async (input: FormData) => {
    setIsLoading(true);
    const { error } = await supabaseClient.auth.signInWithOtp({
      email: input.email.toLowerCase(),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);

    if (error) {
      const isRateLimit = /rate limit|too many requests/i.test(error.message);
      return toast({
        title: isRateLimit ? "Too many sign-in attempts" : "Something went wrong.",
        description: isRateLimit
          ? "Supabase limits how many sign-in emails can be sent. Please wait a few minutes and try again, or use a different email."
          : error.message,
        variant: "destructive",
      });
    }

    return toast({
      title: "Check your email",
      description: "We sent you a login link. Be sure to check your spam too.",
    });
  };

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={(e: BaseSyntheticEvent) => void handleSubmit(onSubmit)(e)}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
            />
            {errors?.email && <p className="px-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <Button disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In with Email
          </Button>
        </div>
      </form>
    </div>
  );
}
