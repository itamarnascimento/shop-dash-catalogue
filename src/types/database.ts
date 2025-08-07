// Tipos para as novas funcionalidades do banco de dados

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface CartItemDB {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    nome_completo?: string;
  };
}

export interface ProductDB {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category?: string;
  category_id?: string;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithProfile extends Review {
  profiles?: {
    nome_completo?: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_value: number;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}


export interface Categories {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}