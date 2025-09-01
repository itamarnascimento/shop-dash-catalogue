import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orderProcessed, setOrderProcessed] = useState(false);

  const sessionId = searchParams.get('session_id');
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    if (cancelled) {
      setLoading(false);
      return;
    }

    if (sessionId && user) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId, user]);

  const verifyPayment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      setOrderProcessed(true);
      clearCart();
      
      toast({
        title: "Pagamento confirmado!",
        description: "Seu pedido foi processado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast({
        title: "Erro na verificação",
        description: "Ocorreu um erro ao verificar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardContent className="p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Processando pagamento...</h2>
              <p className="text-muted-foreground">
                Aguarde enquanto confirmamos sua compra.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">Pagamento Cancelado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Seu pagamento foi cancelado. Você pode tentar novamente quando quiser.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/checkout')} 
                  className="w-full"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')} 
                  className="w-full"
                >
                  Voltar às Compras
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (orderProcessed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Pagamento Confirmado!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Obrigado pela sua compra! Seu pedido foi processado com sucesso e em breve você receberá um e-mail de confirmação.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/order-history')} 
                  className="w-full"
                >
                  Ver Meus Pedidos
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')} 
                  className="w-full"
                >
                  Continuar Comprando
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">Erro no Pagamento</h2>
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro ao processar seu pagamento. Tente novamente.
            </p>
            <Button onClick={() => navigate('/checkout')} className="w-full">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;