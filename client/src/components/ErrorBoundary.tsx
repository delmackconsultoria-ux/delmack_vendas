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

  componentDidCatch() {
    // Erros silenciados - redireciona automaticamente para home
    setTimeout(() => {
      window.location.href = "/";
    }, 100);
  }

  render() {
    if (this.state.hasError) {
      // Retorna null enquanto redireciona - não mostra nenhum erro
      return null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
