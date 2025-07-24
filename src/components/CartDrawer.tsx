import React from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5" />
            <span>Carrinho de Compras</span>
          </SheetTitle>
          <SheetDescription>
            {items.length === 0
              ? 'Seu carrinho está vazio'
              : `${items.length} ${items.length === 1 ? 'item' : 'itens'} no carrinho`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Seu carrinho está vazio</p>
                <Button onClick={onClose} variant="outline">
                  Continuar Comprando
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 space-y-4 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-md bg-background"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.product.price)}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <p className="font-semibold text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <Separator />
                
                {/* Total */}
                <div className="space-y-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ou 12x de {formatPrice(getTotalPrice() / 12)} sem juros
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
                    size="lg"
                  >
                    Finalizar Compra
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                      Continuar Comprando
                    </Button>
                    <Button variant="outline" onClick={clearCart} className="flex-1">
                      Limpar Carrinho
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;