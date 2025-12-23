import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { loadProducts } from '@/data/products';
import { useToast } from '@/hooks/use-toast';
import { ProductDB } from '@/types/database';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const Wishlist: React.FC = () => {
  const [wishlistProducts, setWishlistProducts] = useState<ProductDB[]>([]);
  const { user } = useAuth();
  const { wishlistItems, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();
  const { toast } = useToast();


  const findProducts = async () => {
    try {
      const data = await loadProducts()
      // Buscar produtos completos baseados nos IDs da wishlist
      const fullProducts = wishlistItems
        .map(item => data.find(p => p.id === item.id))
        .filter(Boolean) as ProductDB[];

      setWishlistProducts(fullProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };


  useEffect(() => {
    findProducts()
  }, [wishlistItems]);

  const handleAddToCart = (product: ProductDB) => {
    addToCart(product);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const handleRemoveFromWishlist = (productId: string) => {
    const product = wishlistProducts.find(p => p.id === productId);
    removeFromWishlist(productId);
    if (product) {
      toast({
        title: "Removido da lista de desejos",
        description: `${product.name} foi removido da sua lista de desejos.`,
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Lista de Desejos</h1>
          <p className="text-muted-foreground">Faça login para ver sua lista de desejos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2 flex items-center gap-3">
          <Heart className="h-8 w-8 text-warm-coral fill-warm-coral" />
          Lista de Desejos
        </h1>
        <p className="text-muted-foreground">
          Seus produtos favoritos salvos para depois
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sua lista de desejos está vazia</h3>
            <p className="text-muted-foreground mb-4">
              Adicione produtos à sua lista de desejos clicando no ícone de coração
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-primary to-warm-coral hover:shadow-warm"
            >
              Ver Produtos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistProducts.map((product) => (
            <Card key={product.id} className="group h-full overflow-hidden border-0 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-product hover:scale-[1.02] animate-fade-in">
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFromWishlist(product.id)}
                      className="bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Badge
                      variant="secondary"
                      className="bg-secondary/90 backdrop-blur-sm text-secondary-foreground font-medium"
                    >
                      {product.categories?.name || 'Sem categoria'}
                    </Badge>
                  </div>
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm px-4 py-2">
                        Fora de Estoque
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xl font-bold bg-gradient-to-r from-primary to-warm-coral bg-clip-text text-transparent">
                      {formatPrice(product.price)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ou 12x de {formatPrice(product.price / 12)} sem juros
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.in_stock}
                    className="w-full bg-gradient-to-r from-primary to-warm-coral hover:from-primary/90 hover:to-warm-coral/90 hover:shadow-warm transition-all duration-300 transform hover:scale-[1.02]"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.in_stock ? 'Adicionar ao Carrinho' : 'Indisponível'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;