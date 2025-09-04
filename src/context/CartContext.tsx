import { useAuth } from '@/context/AuthContext';
import { loadProducts } from '@/data/products';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Coupon, ProductDB } from '@/types/database';
import { CartContextType, CartItem } from '@/types/product';
import React, { createContext, ReactNode, useContext, useEffect, useReducer, useState } from 'react';

type CartAction =
  | { type: 'ADD_TO_CART'; product: ProductDB; selectedSize?: string }
  | { type: 'REMOVE_FROM_CART'; productId: string; selectedSize?: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number; selectedSize?: string }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };

const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload;
    case 'ADD_TO_CART':
      const existingItem = state.find(item => 
        item.product.id === action.product.id && 
        item.selectedSize === action.selectedSize
      );
      if (existingItem) {
        return state.map(item =>
          item.product.id === action.product.id && item.selectedSize === action.selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { product: action.product, quantity: 1, selectedSize: action.selectedSize }];

    case 'REMOVE_FROM_CART':
      return state.filter(item => 
        !(item.product.id === action.productId && item.selectedSize === action.selectedSize)
      );

    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return state.filter(item => 
          !(item.product.id === action.productId && item.selectedSize === action.selectedSize)
        );
      }
      return state.map(item =>
        item.product.id === action.productId && item.selectedSize === action.selectedSize
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

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar carrinho do banco de dados quando usuário faz login
  const loadCartFromDB = async () => {
    if (!user) {
      dispatch({ type: 'CLEAR_CART' });
      return;
    }

    try {
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const products = await loadProducts();
      
      const cartItemsWithProducts = await Promise.all(cartItems.map(async (dbItem: any) => {
        const product = products.find(p => p.id === dbItem.product_id);
        
        if (product) {
          return {
            product,
            quantity: dbItem.quantity,
            selectedSize: dbItem.selected_size || undefined
          };
        }
        return null;
      }));

      const validCartItems = cartItemsWithProducts.filter(item => item !== null) as CartItem[];
      dispatch({ type: 'LOAD_CART', payload: validCartItems });
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
    }
  };

  // Salvar item no banco (versão simplificada)
  const saveCartItemToDB = async (item: CartItem) => {
    if (!user) return;

    try {
      await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: item.product.id,
          quantity: item.quantity,
          selected_size: item.selectedSize || null,
        });
    } catch (error) {
      console.error('Erro ao salvar item no carrinho:', error);
    }
  };

  // Remover item do banco
  const removeCartItemFromDB = async (productId: string, selectedSize?: string) => {
    if (!user) return;

    try {
      let query = supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
      
      if (selectedSize) {
        query = query.eq('selected_size', selectedSize);
      } else {
        query = query.is('selected_size', null);
      }
      
      await query;
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

  const addToCart = (product: ProductDB, selectedSize?: string) => {
    dispatch({ type: 'ADD_TO_CART', product, selectedSize });
    
    if (user) {
      // Salvar no banco de forma assíncrona
      setTimeout(async () => {
        const existingItem = items.find(item => 
          item.product.id === product.id && item.selectedSize === selectedSize
        );
        const quantity = existingItem ? existingItem.quantity + 1 : 1;
        await saveCartItemToDB({ product, quantity, selectedSize });
      }, 0);
    }
  };

  const removeFromCart = (productId: string, selectedSize?: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', productId, selectedSize });
    if (user) {
      removeCartItemFromDB(productId, selectedSize);
    }
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity, selectedSize });
    
    if (user) {
      setTimeout(async () => {
        if (quantity <= 0) {
          await removeCartItemFromDB(productId, selectedSize);
        } else {
          const item = items.find(item => 
            item.product.id === productId && item.selectedSize === selectedSize
          );
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

  const applyCoupon = async (couponCode: string): Promise<boolean> => {
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        toast({
          title: 'Cupom inválido',
          description: 'Cupom não encontrado ou expirado.',
          variant: 'destructive',
        });
        return false;
      }

      // Verificar se o cupom ainda está válido
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: 'Cupom expirado',
          description: 'Este cupom já expirou.',
          variant: 'destructive',
        });
        return false;
      }

      // Verificar valor mínimo
      const totalPrice = getTotalPrice();
      if (coupon.minimum_order_value && totalPrice < coupon.minimum_order_value) {
        toast({
          title: 'Valor mínimo não atingido',
          description: `Valor mínimo para este cupom é R$ ${coupon.minimum_order_value.toFixed(2)}`,
          variant: 'destructive',
        });
        return false;
      }

      // Verificar limite de uso
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        toast({
          title: 'Cupom esgotado',
          description: 'Este cupom atingiu o limite de uso.',
          variant: 'destructive',
        });
        return false;
      }

      setAppliedCoupon(coupon as Coupon);
      toast({
        title: 'Cupom aplicado',
        description: `Desconto de ${coupon.discount_type === 'percentage' ? coupon.discount_value + '%' : 'R$ ' + coupon.discount_value.toFixed(2)} aplicado!`,
      });
      return true;
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao aplicar cupom.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    toast({
      title: 'Cupom removido',
      description: 'O cupom foi removido do seu pedido.',
    });
  };

  const getDiscountAmount = (): number => {
    if (!appliedCoupon) return 0;

    const totalPrice = getTotalPrice();
    
    if (appliedCoupon.discount_type === 'percentage') {
      return (totalPrice * appliedCoupon.discount_value) / 100;
    } else {
      return Math.min(appliedCoupon.discount_value, totalPrice);
    }
  };

  const getFinalPrice = (): number => {
    return Math.max(0, getTotalPrice() - getDiscountAmount());
  };

  const value: CartContextType = {
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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};