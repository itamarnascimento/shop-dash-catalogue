import { ProductReviews } from '@/components/ProductReviews';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WishlistButton } from '@/components/WishlistButton';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ProductDB } from '@/types/database';
import { MessageCircle, ShoppingCart, Star } from 'lucide-react';
import React, { useState } from 'react';

interface ProductCardProps {
  product: ProductDB;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [showReviews, setShowReviews] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');

  const handleAddToCart = () => {
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];
    if (sizes.length > 0 && !selectedSize) {
      toast({
        title: "Selecione um tamanho",
        description: "Por favor, selecione um tamanho antes de adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }
    
    addToCart(product, selectedSize || undefined);
    toast({
      title: "Produto adicionado!",
      description: `${product.name}${selectedSize ? ` - Tamanho ${selectedSize}` : ''} foi adicionado ao carrinho.`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Card className="product-card group h-full overflow-hidden animate-fade-in">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-3 right-3 flex gap-2">
           {product.categories?.name && <Badge 
              variant="secondary" 
              className="bg-secondary/90 backdrop-blur-sm text-secondary-foreground font-medium"
            >
              {product.categories?.name}
            </Badge>}
            <WishlistButton product={product} />
          </div>
          {!product.in_stock && (
            <div className="absolute inset-0 bg-muted/80 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="destructive" className="text-sm px-4 py-2">
                Fora de Estoque
              </Badge>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="font-display font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 transition-colors ${
                      i < 5//Math.floor(product.rating)
                        ? 'text-warm-coral fill-current'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {/* {product.rating} ({product.reviews}) */}
                5 5
              </span>
            </div>

            <Dialog open={showReviews} onOpenChange={setShowReviews}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-warm-coral hover:text-warm-coral/80">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Ver avaliações
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">
                    Avaliações - {product.name}
                  </DialogTitle>
                </DialogHeader>
                <ProductReviews productId={product.id} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-warm-coral bg-clip-text text-transparent">
                {formatPrice(product.price)}
              </div>
              <div className="text-xs text-muted-foreground">
                ou 12x de {formatPrice(product.price / 12)} sem juros
              </div>
            </div>
            
            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tamanho:</label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map((size: string) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button 
              onClick={handleAddToCart} 
              disabled={!product.in_stock}
              className="w-full btn-gradient hover:shadow-warm transition-all duration-300 transform hover:scale-[1.02]"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.in_stock ? 'Adicionar ao Carrinho' : 'Indisponível'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;