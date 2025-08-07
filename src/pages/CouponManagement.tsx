import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Calendar, Percent, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Coupon } from '@/types/database';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    minimum_order_value: 0,
    max_uses: '',
    is_active: true,
    expires_at: ''
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons((data || []) as Coupon[]);
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_order_value: 0,
      max_uses: '',
      is_active: true,
      expires_at: ''
    });
    setEditingCoupon(null);
  };

  const handleSaveCoupon = async () => {
    if (!formData.code.trim()) {
      toast({
        title: "Erro",
        description: "O código do cupom é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (formData.discount_value <= 0) {
      toast({
        title: "Erro",
        description: "O valor do desconto deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        minimum_order_value: formData.minimum_order_value,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        is_active: formData.is_active,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Cupom atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Cupom criado com sucesso!",
        });
      }

      setDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error('Erro ao salvar cupom:', error);
      toast({
        title: "Erro",
        description: error.message?.includes('duplicate') ? 'Este código já está em uso' : "Não foi possível salvar o cupom",
        variant: "destructive",
      });
    }
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      minimum_order_value: coupon.minimum_order_value,
      max_uses: coupon.max_uses ? coupon.max_uses.toString() : '',
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? new Date(coupon.expires_at).toISOString().slice(0, 16) : ''
    });
    setDialogOpen(true);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cupom excluído com sucesso!",
      });
      loadCoupons();
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cupom",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (

    <div className="min-h-screen bg-background">
      <Header
        onCartClick={() => setIsCartOpen(true)}
      />
      <div className="max-w-7xl mx-auto mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Cupons</h1>
            <p className="text-muted-foreground">Crie e gerencie cupons de desconto</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: DESCONTO10"
                    className="uppercase"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipo de Desconto *</Label>
                  <Select value={formData.discount_type} onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, discount_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">Valor do Desconto *</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.discount_type === 'percentage' ? 'Ex: 10' : 'Ex: 25.00'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimum_order_value">Valor Mínimo do Pedido</Label>
                  <Input
                    id="minimum_order_value"
                    type="number"
                    min="0"
                    value={formData.minimum_order_value}
                    onChange={(e) => setFormData({ ...formData, minimum_order_value: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses">Limite de Uso</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires_at">Data de Expiração</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do cupom..."
                    rows={3}
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Cupom ativo</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCoupon}>
                  {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabela de Cupons */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Cupons de Desconto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p>Carregando cupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum cupom encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Valor Mínimo</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{coupon.code}</div>
                          {coupon.description && (
                            <div className="text-sm text-muted-foreground">{coupon.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-4 h-4" />
                              {coupon.discount_value}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4" />
                              {formatPrice(coupon.discount_value)}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {coupon.minimum_order_value > 0 ? formatPrice(coupon.minimum_order_value) : 'Sem mínimo'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {coupon.current_uses}
                          {coupon.max_uses && `/${coupon.max_uses}`}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            !coupon.is_active ? "secondary" :
                              isExpired(coupon.expires_at) ? "destructive" :
                                (coupon.max_uses && coupon.current_uses >= coupon.max_uses) ? "destructive" :
                                  "default"
                          }
                        >
                          {!coupon.is_active ? "Inativo" :
                            isExpired(coupon.expires_at) ? "Expirado" :
                              (coupon.max_uses && coupon.current_uses >= coupon.max_uses) ? "Esgotado" :
                                "Ativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {coupon.expires_at ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(coupon.expires_at)}
                          </div>
                        ) : (
                          'Sem expiração'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCoupon(coupon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o cupom "{coupon.code}"?
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};

export default CouponManagement;