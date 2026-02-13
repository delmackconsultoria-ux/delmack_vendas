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
import { Badge } from "./ui/badge";

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  manager: "Gerente",
  broker: "Corretor",
  finance: "Financeiro",
  viewer: "Visualizador",
};

const roleColors: Record<string, string> = {
  superadmin: "bg-purple-600",
  admin: "bg-blue-600",
  manager: "bg-green-600",
  broker: "bg-orange-500",
  finance: "bg-cyan-600",
  viewer: "bg-gray-500",
};

interface NavItem {
  label: string;
  path: string;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Nova Venda", path: "/proposals/new", roles: ["broker", "manager", "admin"] },
  { label: "Aprovação", path: "/sales-approval", roles: ["finance", "manager"] },
  { label: "Calendário", path: "/commissions-calendar", roles: ["finance"] },
  { label: "Comissões Pagas", path: "/paid-commissions", roles: ["finance"] },
  { label: "Histórico", path: "/proposals", roles: ["broker", "manager", "admin", "finance", "viewer"] },
  { label: "Metas", path: "/goals", roles: ["manager"] },
  { label: "Corretores", path: "/brokers", roles: ["manager"] },
  { label: "Indicadores", path: "/indicators", roles: ["broker", "manager", "finance", "admin", "viewer"] },
  { label: "Relatórios", path: "/reports", roles: ["broker", "manager", "finance", "admin", "viewer"] },
  { label: "Ranking", path: "/ranking", roles: ["broker", "finance", "viewer"] },
  { label: "Analytics", path: "/analytics", roles: ["finance", "viewer"] },
];

export function AppHeader() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const visibleItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(user?.role || "");
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 max-w-full">
        {/* Logo - Clicável para Home */}
        <button
          onClick={() => setLocation("/")}
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

        {/* Usuário com Badge de Perfil */}
        <div className="flex items-center gap-4 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sm flex items-center gap-2">
                <span>{user?.name?.split(' ')[0] || "Menu"}{user?.companyName ? ` - ${user.companyName}` : ""}</span>
                {user?.role && (
                  <Badge className={`${roleColors[user.role] || 'bg-gray-500'} text-white text-xs px-2 py-0.5`}>
                    {roleLabels[user.role] || user.role}
                  </Badge>
                )}
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
