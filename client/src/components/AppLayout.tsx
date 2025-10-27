import { useAuth } from "@/_core/hooks/useAuth";
import { AppHeader } from "./AppHeader";
import { Button } from "./ui/button";
import { getLoginUrl } from "@/const";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Acesso Negado</h1>
            <p className="text-sm text-muted-foreground">
              Por favor, faça login para continuar
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}

