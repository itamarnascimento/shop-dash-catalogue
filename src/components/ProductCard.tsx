import React from 'react';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`,
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Card className="group relative overflow-hidden bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Overlay buttons */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-2">
            <Button size="icon" variant="secondary" className="bg-background/90 hover:bg-background">
              <Heart className="w-4 h-4" />
            </Button>
          </div>

          {/* Stock badge */}
          {!product.inStock && (
            <Badge variant="secondary" className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
              Esgotado
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Category */}
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>

          {/* Title and Description */}
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviews})
            </span>
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-foreground">
                {formatPrice(product.price)}
              </div>
              <div className="text-xs text-muted-foreground">
                ou 12x de {formatPrice(product.price / 12)}
              </div>
            </div>
            
            <Button 
              onClick={handleAddToCart} 
              disabled={!product.inStock}
              className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;