import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determinar menu baseado no perfil
  const getMenuItems = () => {
    const baseItems = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Nova Venda", href: "/new-sale" },
      { label: "Indicadores", href: "/indicators" },
    ];

    // Adicionar Relatórios para gerentes e financeiro
    if (user?.role === "manager" || user?.role === "finance" || user?.role === "admin") {
      baseItems.push({ label: "Relatórios", href: "/reports" });
    }

    // Adicionar Ranking para todos
    baseItems.push({ label: "Ranking", href: "/ranking" });

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleNavigate = (href: string) => {
    setLocation(href);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo e Menu */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setLocation("/dashboard")}
            >
              <h1 className="text-2xl font-bold text-slate-900">Delmack</h1>
            </div>

            {/* Menu Desktop */}
            <nav className="hidden md:flex gap-6">
              {menuItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors py-2 px-1 border-b-2 border-transparent hover:border-slate-900"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Direita - Usuário e Ações */}
          <div className="flex items-center gap-4">
            {/* Perfil do Usuário */}
            <div className="hidden sm:flex items-center gap-2 text-right">
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.name || "Usuário"}</p>
                <p className="text-xs text-slate-500 capitalize">
                  {user?.role === "broker"
                    ? "Corretor"
                    : user?.role === "manager"
                      ? "Gerente"
                      : user?.role === "finance"
                        ? "Financeiro"
                        : "Admin"}
                </p>
              </div>
            </div>

            {/* Botão Ranking */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate("/ranking")}
              className="hidden sm:flex gap-2"
            >
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Ranking</span>
            </Button>

            {/* Menu Dropdown - Sair */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="sm:hidden">
                  <div className="w-full">
                    <p className="text-sm font-semibold text-slate-900">{user?.name || "Usuário"}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {user?.role === "broker"
                        ? "Corretor"
                        : user?.role === "manager"
                          ? "Gerente"
                          : user?.role === "finance"
                            ? "Financeiro"
                            : "Admin"}
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="sm:hidden" />
                {menuItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    className="md:hidden"
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botão Sair Desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex gap-2 text-slate-700 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

