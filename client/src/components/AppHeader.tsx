import { useAuth } from "@/_core/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { APP_LOGO, APP_TITLE } from "@/const";
import { LogOut, User, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

interface NavItem {
  label: string;
  path: string;
  roles?: string[]; // Se não definido, mostra para todos
}

const navItems: NavItem[] = [
  { label: "Nova Proposta", path: "/proposals/new", roles: ["broker", "manager", "admin"] },
  { label: "Propostas", path: "/proposals", roles: ["broker", "manager", "admin"] },
  { label: "Indicadores", path: "/indicators", roles: ["manager", "finance", "admin"] },
  { label: "Corretores", path: "/brokers", roles: ["manager"] },
  { label: "Usuários", path: "/users", roles: ["manager"] },
  { label: "Relatórios", path: "/reports", roles: ["manager", "finance", "admin"] },
];

export function AppHeader() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  // Filtrar itens de navegação baseado no papel do usuário
  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true; // Mostra para todos se não houver restrição
    return item.roles.includes(user?.role || "");
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 max-w-full">
        {/* Logo e Título - Clicável para Dashboard */}
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
        >
          <img
            src={APP_LOGO}
            alt={APP_TITLE}
            className="h-8 w-8 rounded-md object-cover"
          />
          <span className="font-semibold tracking-tight text-lg hidden sm:inline">
            {APP_TITLE}
          </span>
        </button>

        {/* Menu Horizontal */}
        <nav className="flex items-center gap-1 mx-auto">
          {visibleItems.map(item => {
            const isActive = location === item.path;
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setLocation(item.path)}
                className="text-sm font-medium"
              >
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* Usuário e Sair */}
        <div className="flex items-center gap-4 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sm">
                {user?.name || "Menu"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setLocation("/profile")}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              {user?.role === "superadmin" && (
                <DropdownMenuItem
                  onClick={() => setLocation("/users")}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Gestão de Usuários</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

