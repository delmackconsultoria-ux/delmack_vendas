import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error silently to console instead of showing to user
    console.error("[ErrorBoundary] Erro capturado:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="flex flex-col items-center w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle
                size={32}
                className="text-amber-600"
              />
            </div>

            <h2 className="text-xl font-semibold text-slate-900 mb-2 text-center">
              Ops! Algo deu errado
            </h2>

            <p className="text-slate-600 text-center mb-6">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página ou voltar para a tela inicial.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => window.location.href = "/"}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                  "bg-slate-100 text-slate-700",
                  "hover:bg-slate-200 transition-colors"
                )}
              >
                <Home size={16} />
                Início
              </button>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                  "bg-blue-600 text-white",
                  "hover:bg-blue-700 transition-colors"
                )}
              >
                <RotateCcw size={16} />
                Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
