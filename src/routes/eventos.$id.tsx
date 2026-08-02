import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useListing } from "@/lib/listings";
import { Loader2 } from "lucide-react";
import { OfferDetailView } from "@/components/OfferDetailView";

export const Route = createFileRoute("/eventos/$id")({
  head: () => ({ meta: [{ title: "Evento — Bora Pass" }] }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { data: event, isLoading } = useListing(id);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  if (!event) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <span className="text-5xl">📅</span>
          <h2 className="mt-4 text-lg font-bold text-foreground">Evento não encontrado</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Este evento não está disponível no momento.
          </p>
          <Link
            to="/eventos"
            className="mt-5 rounded-2xl bg-gradient-brand px-5 py-2.5 text-xs font-bold text-white shadow-brand"
          >
            Ver Todos os Eventos
          </Link>
        </div>
      </AppShell>
    );
  }

  return <OfferDetailView listing={event} backRoute="/eventos" />;
}
