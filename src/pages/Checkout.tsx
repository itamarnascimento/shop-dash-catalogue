import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, User, Plus, Check, Tag, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart, appliedCoupon, applyCoupon, removeCoupon, getDiscountAmount, getFinalPrice } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
  });

  useEffect(() => {
    loadSavedAddresses();
  }, [user]);

  const loadSavedAddresses = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`https://vrenmohimskinepiwufd.supabase.co/rest/v1/delivery_addresses?user_id=eq.${user.id}&order=is_default.desc,created_at.desc`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZW5tb2hpbXNraW5lcGl3dWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjIwMDQsImV4cCI6MjA2ODkzODAwNH0.k49A6Kfub5z1ZuctFARYs53LZmxyfjuTlLZf-bvUvA0',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (response.ok) {
        const addresses = await response.json();
        setSavedAddresses(addresses);
        
        // Selecionar automaticamente o endereço padrão se existir
        const defaultAddress = addresses.find(addr => addr.is_default);
        if (defaultAddress && !useNewAddress) {
          setSelectedAddressId(defaultAddress.id);
          setShippingAddress({
            name: defaultAddress.recipient_name,
            street: defaultAddress.street,
            city: defaultAddress.city,
            state: defaultAddress.state,
            zip_code: defaultAddress.zip_code,
            phone: defaultAddress.phone,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
    }
  };

  const handleAddressSelect = (addressId) => {
    if (addressId === 'new') {
      setUseNewAddress(true);
      setSelectedAddressId('');
      setShippingAddress({
        name: '',
        street: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
      });
    } else {
      setUseNewAddress(false);
      setSelectedAddressId(addressId);
      const address = savedAddresses.find(addr => addr.id === addressId);
      if (address) {
        setShippingAddress({
          name: address.recipient_name,
          street: address.street,
          city: address.city,
          state: address.state,
          zip_code: address.zip_code,
          phone: address.phone,
        });
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleInputChange = (field: string, value: string) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = ['name', 'street', 'city', 'state', 'zip_code', 'phone'];
    for (const field of requiredFields) {
      if (!shippingAddress[field as keyof typeof shippingAddress]) {
        toast({
          title: "Erro",
          description: `O campo ${field === 'name' ? 'nome' : field === 'street' ? 'endereço' : field === 'city' ? 'cidade' : field === 'state' ? 'estado' : field === 'zip_code' ? 'CEP' : 'telefone'} é obrigatório`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleFinalizePurchase = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para finalizar a compra",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Erro",
        description: "Seu carrinho está vazio",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items,
          total_amount: getFinalPrice(),
          shipping_address: shippingAddress,
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("Não foi possível criar a sessão de pagamento");
      }

    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      toast({
        title: "Erro na compra",
        description: "Ocorreu um erro ao processar sua compra. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">Você precisa estar logado para acessar o checkout.</p>
          <Button onClick={() => navigate('/auth')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carrinho Vazio</h1>
          <p className="text-muted-foreground mb-4">Adicione produtos ao carrinho para continuar.</p>
          <Button onClick={() => navigate('/')}>
            Ver Produtos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Finalizar Compra
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de Endereços */}
              {savedAddresses.length > 0 && (
                <div>
                  <Label>Escolher Endereço</Label>
                  <Select value={selectedAddressId || 'new'} onValueChange={handleAddressSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um endereço" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Novo endereço
                        </div>
                      </SelectItem>
                      {savedAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          <div>
                            <div className="font-medium">{address.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {address.street}, {address.city}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Campos do formulário (mostrar apenas se for novo endereço ou não houver endereços salvos) */}
              {(useNewAddress || savedAddresses.length === 0) && (
                <>
                  <div>
                    <Label htmlFor="name">Nome Completo *</Label>
                    <Input
                      id="name"
                      value={shippingAddress.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="street">Endereço *</Label>
                    <Input
                      id="street"
                      value={shippingAddress.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade *</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado *</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip_code">CEP *</Label>
                      <Input
                        id="zip_code"
                        value={shippingAddress.zip_code}
                        onChange={(e) => handleInputChange('zip_code', e.target.value)}
                        placeholder="00000-000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={shippingAddress.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Resumo do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Itens */}
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qtd: {item.quantity} × {formatPrice(item.product.price)}
                      </p>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                  </div>
                ))}

                <Separator />

                {/* Seção de Cupons */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <Label>Cupom de Desconto</Label>
                  </div>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <div className="font-medium text-green-800">{appliedCoupon.code}</div>
                        <div className="text-sm text-green-600">{appliedCoupon.description}</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite o código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => applyCoupon(couponCode)}
                        disabled={!couponCode.trim()}
                      >
                        Aplicar
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto ({appliedCoupon.code}):</span>
                      <span>-{formatPrice(getDiscountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Frete:</span>
                    <span className="text-green-600">Grátis</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(getFinalPrice())}</span>
                  </div>
                </div>

                {/* Botão de Finalizar */}
                <Button 
                  className="w-full mt-6" 
                  size="lg"
                  onClick={handleFinalizePurchase}
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Finalizar Compra'}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Ao finalizar a compra, você concorda com nossos termos de uso
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;