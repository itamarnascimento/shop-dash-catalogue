import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, User, MapPin, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderDetailData {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  shipping_address: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome_completo?: string;
    telefone?: string;
  };
  order_items?: Array<{
    id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  const loadOrderDetail = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      if (!orderData) {
        setOrder(null);
        return;
      }

      // Buscar perfil do usuário
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nome_completo, telefone')
        .eq('user_id', orderData.user_id)
        .single();

      // Buscar itens do pedido
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (orderItemsError) throw orderItemsError;

      // Combinar dados
      const orderWithDetails = {
        ...orderData,
        profiles: profileData || null,
        order_items: orderItemsData || []
      };

      setOrder(orderWithDetails);
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do pedido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
      case 'delivered': return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'processing': return 'Processando';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando detalhes do pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Pedido não encontrado</h2>
          <p className="text-muted-foreground mb-4">O pedido solicitado não existe ou foi removido.</p>
          <Button asChild>
            <Link to="/admin/orders">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Pedidos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/orders">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Pedido #{order.id.slice(0, 8)}
              </h1>
              <p className="text-muted-foreground">
                Criado em {new Date(order.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Resumo do Pedido</span>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Package className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold">{getStatusText(order.status)}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-semibold">{formatPrice(Number(order.total_amount))}</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Criado</p>
                      <p className="font-semibold">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Atualizado</p>
                      <p className="font-semibold">
                        {new Date(order.updated_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                  <CardDescription>
                    {order.order_items?.length || 0} item(s) neste pedido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items?.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{item.product_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantity} × {formatPrice(Number(item.unit_price))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-foreground">
                            {formatPrice(Number(item.total_price))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{order.profiles?.nome_completo || 'N/A'}</p>
                  </div>
                  {order.profiles?.telefone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-semibold">{order.profiles.telefone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-semibold">{order.shipping_address?.name}</p>
                  </div>
                  <div>
                    <p>{order.shipping_address?.street}</p>
                    <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                    <p>CEP: {order.shipping_address?.zip_code}</p>
                  </div>
                  {order.shipping_address?.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p>{order.shipping_address.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;