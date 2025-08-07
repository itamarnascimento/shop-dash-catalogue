import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Coupon, ProductDB } from '@/types/database';
import { CartContextType, CartItem } from '@/types/product';
import React, { createContext, ReactNode, useContext, useEffect, useReducer, useState } from 'react';

type CartAction =
  | { type: 'ADD_TO_CART'; product: ProductDB }
  | { type: 'REMOVE_FROM_CART'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload;
    case 'ADD_TO_CART':
      const existingItem = state.find(item => item.product.id === action.product.id);
      if (existingItem) {
        return state.map(item =>
          item.product.id === action.product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { product: action.product, quantity: 1 }];

    case 'REMOVE_FROM_CART':
      return state.filter(item => item.product.id !== action.productId);

    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return state.filter(item => item.product.id !== action.productId);
      }
      return state.map(item =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );

    case 'CLEAR_CART':
      return [];

    default:
      return state;
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar carrinho do banco quando usuário faz login
  const loadCartFromDB = async () => {
    if (!user) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Converter dados do banco para formato do carrinho local
      const cartItems = await Promise.all((data || []).map(async (dbItem) => {
        // Buscar dados do produto nos produtos estáticos (por enquanto)
        const products = await import('@/data/products');
        const product = products.products.find(p => p.id === dbItem.product_id);
        
        if (product) {
          return {
            product,
            quantity: dbItem.quantity
          };
        }
        return null;
      }));

      const validCartItems = cartItems.filter(item => item !== null) as CartItem[];
      dispatch({ type: 'LOAD_CART', payload: validCartItems });
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
  };

  // Salvar item no banco
  const saveCartItemToDB = async (item: CartItem) => {
    if (!user) return;

    try {
      await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: item.product.id,
          quantity: item.quantity,
        });
    } catch (error) {
      console.error('Erro ao salvar item no carrinho:', error);
    }
  };

  // Remover item do banco
  const removeCartItemFromDB = async (productId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
    }
  };

  // Limpar carrinho do banco
  const clearCartFromDB = async () => {
    if (!user) return;

    try {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
    }
  };

  useEffect(() => {
    loadCartFromDB();
  }, [user]);

  const addToCart = (product: ProductDB) => {
    dispatch({ type: 'ADD_TO_CART', product });
    
    if (user) {
      // Salvar no banco de forma assíncrona
      setTimeout(async () => {
        const existingItem = items.find(item => item.product.id === product.id);
        const quantity = existingItem ? existingItem.quantity + 1 : 1;
        await saveCartItemToDB({ product, quantity });
      }, 0);
    }
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', productId });
    if (user) {
      removeCartItemFromDB(productId);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
    
    if (user) {
      setTimeout(async () => {
        if (quantity <= 0) {
          await removeCartItemFromDB(productId);
        } else {
          const item = items.find(item => item.product.id === productId);
          if (item) {
            await saveCartItemToDB({ ...item, quantity });
          }
        }
      }, 0);
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    if (user) {
      clearCartFromDB();
    }
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Funções para cupons
  const applyCoupon = async (couponCode: string) => {
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        toast({
          title: "Cupom inválido",
          description: "Cupom não encontrado ou inativo",
          variant: "destructive",
        });
        return false;
      }

      // Verificar se não expirou
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: "Cupom expirado",
          description: "Este cupom não é mais válido",
          variant: "destructive",
        });
        return false;
      }

      // Verificar valor mínimo do pedido
      const subtotal = getTotalPrice();
      if (subtotal < coupon.minimum_order_value) {
        toast({
          title: "Valor mínimo não atingido",
          description: `Pedido mínimo de R$ ${coupon.minimum_order_value.toFixed(2)} para usar este cupom`,
          variant: "destructive",
        });
        return false;
      }

      // Verificar limite de uso
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        toast({
          title: "Cupom esgotado",
          description: "Este cupom já atingiu o limite de uso",
          variant: "destructive",
        });
        return false;
      }

      setAppliedCoupon(coupon as Coupon);
      toast({
        title: "Cupom aplicado!",
        description: `Desconto de ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value.toFixed(2)}`} aplicado`,
      });
      return true;
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar o cupom",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: "Cupom removido",
      description: "O desconto foi removido do seu pedido",
    });
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = getTotalPrice();
    if (appliedCoupon.discount_type === 'percentage') {
      return (subtotal * appliedCoupon.discount_value) / 100;
    } else {
      return Math.min(appliedCoupon.discount_value, subtotal);
    }
  };

  const getFinalPrice = () => {
    const subtotal = getTotalPrice();
    const discount = getDiscountAmount();
    return Math.max(0, subtotal - discount);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        getTotalItems,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        getDiscountAmount,
        getFinalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};