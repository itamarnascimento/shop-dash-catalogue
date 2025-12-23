import { ProductDB } from "./database";

export interface CartItem {
  product: ProductDB;
  quantity: number;
  selectedSize?: string;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductDB, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  appliedCoupon: any;
  applyCoupon: (couponCode: string) => Promise<boolean>;
  removeCoupon: () => void;
  getDiscountAmount: () => number;
  getFinalPrice: () => number;
}