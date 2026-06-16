import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl mb-4 text-foreground">404</h1>
        <h2 className="text-3xl mb-4 text-foreground">Página não encontrada</h2>
        <p className="text-muted-foreground mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg transition-colors"
        >
          <Home size={20} />
          Voltar para o Dashboard
        </Link>
      </div>
    </div>
  );
}
