import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, ArrowUp, ArrowDown, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';

interface CarouselImage {
  id: string;
  url: string;
  alt_text: string;
  title?: string;
  order_position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CarouselManagement = () => {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<CarouselImage | null>(null);
  const [formData, setFormData] = useState({
    url: '',
    alt_text: '',
    title: '',
    order_position: 0,
    is_active: true
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('carousel_images')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao carregar imagens do carrossel: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingImage) {
        const { error } = await supabase
          .from('carousel_images')
          .update(formData)
          .eq('id', editingImage.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Imagem atualizada com sucesso!"
        });
      } else {
        const { error } = await supabase
          .from('carousel_images')
          .insert([formData]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Imagem adicionada com sucesso!"
        });
      }

      setDialogOpen(false);
      resetForm();
      loadImages();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao salvar imagem: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta imagem?')) return;

    try {
      const { error } = await supabase
        .from('carousel_images')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Sucesso",
        description: "Imagem excluída com sucesso!"
      });
      loadImages();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao excluir imagem: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentImage = images.find(img => img.id === id);
    if (!currentImage) return;

    const newPosition = direction === 'up'
      ? currentImage.order_position - 1
      : currentImage.order_position + 1;

    try {
      const { error } = await supabase
        .from('carousel_images')
        .update({ order_position: newPosition })
        .eq('id', id);

      if (error) throw error;
      loadImages();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao reordenar imagem: " + error.message,
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      url: '',
      alt_text: '',
      title: '',
      order_position: Math.max(...images.map(img => img.order_position), 0) + 1,
      is_active: true
    });
    setEditingImage(null);
  };

  const openDialog = (image?: CarouselImage) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        url: image.url,
        alt_text: image.alt_text,
        title: image.title || '',
        order_position: image.order_position,
        is_active: image.is_active
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onCartClick={() => setIsCartOpen(true)}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Carrossel</h1>
            <p className="text-muted-foreground">Gerencie as imagens do carrossel da página inicial</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Imagem
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {editingImage ? 'Editar Imagem' : 'Nova Imagem'}
                </DialogTitle>
                <DialogDescription>
                  {editingImage ? 'Edite as informações da imagem do carrossel.' : 'Adicione uma nova imagem ao carrossel.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="url">URL da Imagem</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="alt_text">Texto Alternativo</Label>
                  <Input
                    id="alt_text"
                    value={formData.alt_text}
                    onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                    placeholder="Descrição da imagem para acessibilidade"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="title">Título (Opcional)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título da imagem"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="order_position">Posição</Label>
                  <Input
                    id="order_position"
                    type="number"
                    value={formData.order_position}
                    onChange={(e) => setFormData({ ...formData, order_position: parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Ativo</Label>
                </div>

                {formData.url && (
                  <div className="grid gap-2">
                    <Label>Preview</Label>
                    <img
                      src={formData.url}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border"
                      onError={() => toast({
                        title: "Erro",
                        description: "Não foi possível carregar a imagem",
                        variant: "destructive"
                      })}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingImage ? 'Atualizar' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Imagens do Carrossel</CardTitle>
            <CardDescription>
              Lista de todas as imagens configuradas para o carrossel
            </CardDescription>
          </CardHeader>
          <CardContent>
            {images.length === 0 ? (
              <div className="text-center py-8">
                <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma imagem encontrada</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Alt Text</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image) => (
                    <TableRow key={image.id}>
                      <TableCell>
                        <img
                          src={image.url}
                          alt={image.alt_text}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {image.title || 'Sem título'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {image.alt_text}
                      </TableCell>
                      <TableCell>{image.order_position}</TableCell>
                      <TableCell>
                        <Badge variant={image.is_active ? "default" : "secondary"}>
                          {image.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleReorder(image.id, 'up')}
                            disabled={image.order_position === 1}
                          >
                            <ArrowUp className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleReorder(image.id, 'down')}
                            disabled={image.order_position === Math.max(...images.map(img => img.order_position))}
                          >
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDialog(image)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(image.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

export default CarouselManagement;