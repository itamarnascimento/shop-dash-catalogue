import React, { useState, useEffect } from 'react';
import { Package, Calendar, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/database';

interface OrderWithItems {
  id: string;
  user_id: string;
  status: string;
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
  order_items: OrderItem[];
}

const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOrderHistory();
    }
  }, [user]);

  const loadOrderHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []) as OrderWithItems[]);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'processing': return 'bg-blue-500 text-white';
      case 'shipped': return 'bg-blue-600 text-white';
      case 'delivered': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Histórico de Pedidos</h1>
          <p className="text-muted-foreground">Faça login para ver seu histórico de pedidos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Histórico de Pedidos
        </h1>
        <p className="text-muted-foreground">
          Acompanhe o status dos seus pedidos personalizados
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              Você ainda não fez nenhum pedido. Que tal dar uma olhada em nossos produtos?
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-secondary/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Pedido #{order.id.slice(0, 8)}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    {formatPrice(order.total_amount)}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Itens do Pedido</h4>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-secondary/20 rounded-lg">
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h5 className="font-medium">{item.product_name}</h5>
                            <p className="text-sm text-muted-foreground">
                              Quantidade: {item.quantity} • {formatPrice(item.unit_price)} cada
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              Total: {formatPrice(item.total_price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Endereço de Entrega
                    </h4>
                    <div className="p-4 bg-secondary/20 rounded-lg space-y-1">
                      <p className="font-medium">{order.shipping_address.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address.street}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address.city}, {order.shipping_address.state}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        CEP: {order.shipping_address.zip_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Tel: {order.shipping_address.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;