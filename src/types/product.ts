import { ProductDB } from "./database";


export interface CartItem {
  product: ProductDB;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: ProductDB) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  appliedCoupon: any;
  applyCoupon: (couponCode: string) => Promise<boolean>;
  removeCoupon: () => void;
  getDiscountAmount: () => number;
  getFinalPrice: () => number;
}