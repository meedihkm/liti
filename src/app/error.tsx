"use client";

/**
 * Composant d'erreur Next.js pour capturer les erreurs de rendu
 * côté client dans l'application principale.
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Log l'erreur dans la console (ou service externe en production)
    console.error("[Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="mx-auto w-full max-w-lg border-destructive/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Une erreur s'est produite</CardTitle>
          <CardDescription className="text-base">
            خطأ في التطبيق
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Désolé, une erreur inattendue s'est produite lors de l'affichage de cette page.
          </p>

          {isDev && error.message && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs font-mono text-destructive">{error.message}</p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Afficher la trace
                  </summary>
                  <pre className="mt-2 overflow-auto text-[10px] leading-tight text-muted-foreground">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={reset} variant="default" className="flex-1">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Réessayer
            </Button>
            <Button onClick={() => router.push("/")} variant="outline" className="flex-1">
              <Home className="h-4 w-4" aria-hidden="true" />
              Accueil
            </Button>
          </div>

          {error.digest && (
            <p className="text-center text-xs text-muted-foreground">
              Code d'erreur : {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
