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

  componentDidCatch(error: Error) {
    // Logar o erro para debug
    console.error("[ErrorBoundary] Erro capturado:", error);
    console.error("[ErrorBoundary] Stack:", error.stack);
    // NÃO redirecionar - deixar o usuário ver o erro
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee'}}>
          <div style={{textAlign: 'center', padding: '32px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '500px'}}>
            <h1 style={{fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px'}}>Erro na Aplicacao</h1>
            <p style={{color: '#374151', marginBottom: '16px'}}>{this.state.error?.message}</p>
            <details style={{textAlign: 'left', marginBottom: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '14px', maxHeight: '160px', overflow: 'auto'}}>
              <summary style={{cursor: 'pointer', fontWeight: '600', marginBottom: '8px'}}>Detalhes do Erro</summary>
              <pre style={{whiteSpace: 'pre-wrap', wordBreak: 'break-word'}}>{this.state.error?.stack}</pre>
            </details>
            <button
              onClick={() => window.location.href = '/'}
              style={{padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}
            >
              Voltar para Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
