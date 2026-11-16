"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary React pour capturer les erreurs dans les vues admin
 * sans faire tomber tout le back-office.
 */
export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("[AdminErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === "development";

      return (
        <Card className="mx-auto my-8 max-w-lg border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
            </div>
            <CardTitle>Erreur dans cette vue</CardTitle>
            <CardDescription>Une erreur s'est produite lors du rendu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isDev && this.state.error?.message && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-xs font-mono text-destructive">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="mt-2 overflow-auto text-[10px] leading-tight text-muted-foreground">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <Button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              variant="default"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Réessayer
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
