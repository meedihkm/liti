import { AppShell } from "@/components/app/app-shell";

// Point d'entrée unique : la vitrine publique + configurateur + suivi
// ET le back-office admin vivent dans cette SPA hash-routée (#/…).
export default function Page() {
  return <AppShell />;
}
