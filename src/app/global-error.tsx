"use client";

/**
 * Global error boundary - capture les erreurs qui échappent à error.tsx,
 * notamment dans le layout racine.
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errortsx
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  return (
    <html lang="fr" dir="ltr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "1rem",
            backgroundColor: "#fafafa",
            color: "#171717",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "32rem",
              padding: "2rem",
              backgroundColor: "white",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Erreur critique
            </h1>
            <p style={{ fontSize: "1rem", color: "#737373", marginBottom: "1.5rem" }}>
              خطأ حرج في التطبيق
            </p>

            <p style={{ fontSize: "0.875rem", color: "#525252", marginBottom: "1.5rem" }}>
              Une erreur critique s'est produite. Veuillez réessayer ou contacter le support si
              le problème persiste.
            </p>

            {isDev && error.message && (
              <div
                style={{
                  padding: "0.75rem",
                  backgroundColor: "#fef2f2",
                  borderRadius: "0.375rem",
                  marginBottom: "1.5rem",
                  textAlign: "left",
                }}
              >
                <code style={{ fontSize: "0.75rem", color: "#dc2626", wordBreak: "break-word" }}>
                  {error.message}
                </code>
              </div>
            )}

            <button
              onClick={reset}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#171717",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Réessayer
            </button>

            {error.digest && (
              <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "#a3a3a3" }}>
                Référence : {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
