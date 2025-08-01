import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface DeliveryAddress {
  id: string;
  name: string;
  recipient_name: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  is_default: boolean;
}

const addressSchema = z.object({
  name: z.string().min(1, "Nome do endereço é obrigatório"),
  recipient_name: z.string().min(1, "Nome do destinatário é obrigatório"),
  street: z.string().min(1, "Rua é obrigatória"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zip_code: z.string().min(1, "CEP é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  is_default: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

const DeliveryAddresses: React.FC = () => {
  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<DeliveryAddress | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: '',
      recipient_name: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      is_default: false,
    },
  });

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;

    try {
      // Usar query SQL direta até os tipos serem atualizados
      const { data, error } = await supabase.rpc('get_current_user_role');
      
      if (error) {
        console.error('Erro na consulta:', error);
      }

      // Fazer query manual por enquanto
      const response = await fetch(`https://vrenmohimskinepiwufd.supabase.co/rest/v1/delivery_addresses?user_id=eq.${user.id}&order=is_default.desc,created_at.desc`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZW5tb2hpbXNraW5lcGl3dWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjIwMDQsImV4cCI6MjA2ODkzODAwNH0.k49A6Kfub5z1ZuctFARYs53LZmxyfjuTlLZf-bvUvA0',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const addresses = await response.json();
        setAddresses(addresses || []);
      } else {
        throw new Error('Erro ao carregar endereços');
      }
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os endereços.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AddressFormData) => {
    if (!user) return;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      if (editingAddress) {
        const response = await fetch(`https://vrenmohimskinepiwufd.supabase.co/rest/v1/delivery_addresses?id=eq.${editingAddress.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZW5tb2hpbXNraW5lcGl3dWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjIwMDQsImV4cCI6MjA2ODkzODAwNH0.k49A6Kfub5z1ZuctFARYs53LZmxyfjuTlLZf-bvUvA0',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, updated_at: new Date().toISOString() }),
        });

        if (!response.ok) throw new Error('Erro ao atualizar endereço');

        toast({
          title: "Endereço atualizado",
          description: "O endereço foi atualizado com sucesso.",
        });
      } else {
        const response = await fetch(`https://vrenmohimskinepiwufd.supabase.co/rest/v1/delivery_addresses`, {
          method: 'POST',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZW5tb2hpbXNraW5lcGl3dWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjIwMDQsImV4cCI6MjA2ODkzODAwNH0.k49A6Kfub5z1ZuctFARYs53LZmxyfjuTlLZf-bvUvA0',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...data, user_id: user.id }),
        });

        if (!response.ok) throw new Error('Erro ao criar endereço');

        toast({
          title: "Endereço criado",
          description: "O endereço foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingAddress(null);
      form.reset();
      loadAddresses();
    } catch (error) {
      console.error('Erro ao salvar endereço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o endereço.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (address: DeliveryAddress) => {
    setEditingAddress(address);
    form.reset(address);
    setIsDialogOpen(true);
  };

  const handleDelete = async (addressId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(`https://vrenmohimskinepiwufd.supabase.co/rest/v1/delivery_addresses?id=eq.${addressId}`, {
        method: 'DELETE',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZW5tb2hpbXNraW5lcGl3dWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjIwMDQsImV4cCI6MjA2ODkzODAwNH0.k49A6Kfub5z1ZuctFARYs53LZmxyfjuTlLZf-bvUvA0',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao deletar endereço');

      toast({
        title: "Endereço removido",
        description: "O endereço foi removido com sucesso.",
      });

      loadAddresses();
    } catch (error) {
      console.error('Erro ao remover endereço:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o endereço.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const response = await fetch(`https://vrenmohimskinepiwufd.supabase.co/rest/v1/delivery_addresses?id=eq.${addressId}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZW5tb2hpbXNraW5lcGl3dWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjIwMDQsImV4cCI6MjA2ODkzODAwNH0.k49A6Kfub5z1ZuctFARYs53LZmxyfjuTlLZf-bvUvA0',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_default: true }),
      });

      if (!response.ok) throw new Error('Erro ao definir endereço padrão');

      toast({
        title: "Endereço padrão definido",
        description: "Este endereço foi definido como padrão.",
      });

      loadAddresses();
    } catch (error) {
      console.error('Erro ao definir endereço padrão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível definir o endereço como padrão.",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setEditingAddress(null);
    form.reset({
      name: '',
      recipient_name: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      is_default: addresses.length === 0, // Se não há endereços, marcar como padrão
    });
    setIsDialogOpen(true);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Endereços de Entrega</h1>
          <p className="text-muted-foreground">Faça login para gerenciar seus endereços.</p>
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Endereços de Entrega
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus endereços de entrega
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Endereço
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Editar Endereço' : 'Novo Endereço'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Endereço</FormLabel>
                        <FormControl>
                          <Input placeholder="Casa, Trabalho, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipient_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Destinatário</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, complemento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Estado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Endereço Padrão
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Usar este endereço como padrão para entregas
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAddress ? 'Atualizar' : 'Criar'} Endereço
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {addresses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Adicione um endereço de entrega para finalizar suas compras.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Endereço
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {addresses.map((address) => (
            <Card key={address.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {address.name}
                    </CardTitle>
                    {address.is_default && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        <Star className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {!address.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        Definir como Padrão
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(address.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{address.recipient_name}</p>
                  <p className="text-sm text-muted-foreground">{address.street}</p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} - {address.zip_code}
                  </p>
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryAddresses;