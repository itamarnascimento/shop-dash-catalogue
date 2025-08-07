import { Button } from '@/components/ui/button';
import { useWishlist } from '@/context/WishlistContext';
import { ProductDB } from '@/types/database';
import { Heart } from 'lucide-react';
import React from 'react';

interface WishlistButtonProps {
  product: ProductDB;
  className?: string;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({ product, className = "" }) => {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id);

  const handleToggle = () => {
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={`transition-all duration-300 hover:scale-110 ${className}`}
      aria-label={inWishlist ? "Remover da lista de desejos" : "Adicionar à lista de desejos"}
    >
      <Heart 
        className={`h-5 w-5 transition-colors duration-300 ${
          inWishlist 
            ? 'fill-warm-coral text-warm-coral' 
            : 'text-muted-foreground hover:text-warm-coral'
        }`} 
      />
    </Button>
  );
};