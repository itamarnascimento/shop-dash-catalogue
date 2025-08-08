import { NotificationCenter } from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Heart, Images, LogOut, MapPin, Package, Search, Settings, ShoppingCart, Tag, User } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onCartClick: () => void;
  visibleSearchBar?: boolean
}

const Header: React.FC<HeaderProps> = ({ onSearchChange, onCartClick, visibleSearchBar = false }) => {
  const { getTotalItems } = useCart();
  const { user, signOut, profile } = useAuth();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const totalItems = getTotalItems();
  const widthPage = window.innerWidth
  
  
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <img
              src="/lovable-uploads/137beee5-807f-4387-b7cb-717db9d00a6d.png"
              alt="Dias personalizados"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-xl font-bold text-foreground hidden sm:block">Dias personalizados</h1>
          </Link>

          {/* Search Bar */}
          {
            visibleSearchBar && <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="pl-10 bg-background border-border"
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
            </div>
          }
          {/* Actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                {/* Notification Center */}
                <NotificationCenter />

                {/* Navigation Links */}
                <nav className="hidden md:flex items-center space-x-1 mr-4">
                  <Button
                    variant={location.pathname === '/' ? 'secondary' : 'ghost'}
                    size="sm"
                    asChild
                  >
                    <Link to="/">
                      Produtos
                    </Link>
                  </Button>
                  <Button
                    variant={location.pathname === '/wishlist' ? 'secondary' : 'ghost'}
                    size="sm"
                    asChild
                  >
                  </Button>                 
                </nav>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={(widthPage < 400 ? "sm:hidden" : "hidden sm:flex")}>
                      <User className="w-4 h-4 mr-2" />
                     {widthPage > 400 && (profile?.nome_completo || user.email)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/wishlist">
                        <Heart className="w-4 h-4 mr-2" />
                        Lista de Desejos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/orders">
                        <Package className="w-4 h-4 mr-2" />
                        Histórico de Pedidos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/addresses">
                        <MapPin className="w-4 h-4 mr-2" />
                        Endereços de Entrega
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/products">
                            <Settings className="w-4 h-4 mr-2" />
                            Gerenciar Produtos
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/categories">
                            <Settings className="w-4 h-4 mr-2" />
                            Gerenciar Categorias
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/users">
                            <Settings className="w-4 h-4 mr-2" />
                            Gerenciar Usuários
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/orders">
                            <Settings className="w-4 h-4 mr-2" />
                            Gerenciar Pedidos
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/carousel">
                            <Images className="w-4 h-4 mr-2" />
                            Gerenciar Carrossel
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/coupons">
                            <Tag className="w-4 h-4 mr-2" />
                            Gerenciar Cupons
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>             
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">
                  <User className="w-4 h-4 mr-2" />
                  Entrar
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;