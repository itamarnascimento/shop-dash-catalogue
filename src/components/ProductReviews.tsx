import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Review } from '@/types/database';

interface ProductReviewsProps {
  productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles!inner(nome_completo)
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReviews(data || []);
      
      // Verificar se o usuário já tem review
      if (user) {
        const existingReview = data?.find(review => review.user_id === user.id);
        setUserReview(existingReview || null);
        if (existingReview) {
          setNewRating(existingReview.rating);
          setNewComment(existingReview.comment || '');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    }
  };

  const submitReview = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para avaliar o produto",
        variant: "destructive",
      });
      return;
    }

    if (newRating === 0) {
      toast({
        title: "Avaliação necessária",
        description: "Selecione uma nota de 1 a 5 estrelas",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const reviewData = {
        user_id: user.id,
        product_id: productId,
        rating: newRating,
        comment: newComment.trim() || null,
      };

      if (userReview) {
        // Atualizar review existente
        const { error } = await supabase
          .from('reviews')
          .update(reviewData)
          .eq('id', userReview.id);

        if (error) throw error;

        toast({
          title: "Avaliação atualizada",
          description: "Sua avaliação foi atualizada com sucesso",
        });
      } else {
        // Criar nova review
        const { error } = await supabase
          .from('reviews')
          .insert([reviewData]);

        if (error) throw error;

        toast({
          title: "Avaliação enviada",
          description: "Sua avaliação foi publicada com sucesso",
        });
      }

      setIsEditing(false);
      loadReviews();
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar sua avaliação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? 'fill-warm-coral text-warm-coral'
                : 'text-muted-foreground'
            } ${interactive ? 'cursor-pointer hover:text-warm-coral transition-colors' : ''}`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Estatísticas gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Avaliações dos Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </div>

          {/* Formulário de avaliação */}
          {user && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">
                {userReview ? 'Sua avaliação:' : 'Avaliar produto:'}
              </h4>
              
              {!isEditing && userReview ? (
                <div className="space-y-2">
                  {renderStars(userReview.rating)}
                  {userReview.comment && (
                    <p className="text-sm text-muted-foreground">{userReview.comment}</p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar avaliação
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Nota:</label>
                    {renderStars(newRating, true, setNewRating)}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Comentário (opcional):</label>
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Conte sua experiência com este produto..."
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={submitReview}
                      disabled={loading || newRating === 0}
                      className="bg-gradient-to-r from-warm-coral to-dusty-rose hover:shadow-warm transition-all duration-300"
                    >
                      {loading ? 'Salvando...' : userReview ? 'Atualizar' : 'Enviar'}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          if (userReview) {
                            setNewRating(userReview.rating);
                            setNewComment(userReview.comment || '');
                          }
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de avaliações */}
      {reviews.filter(review => review.user_id !== user?.id).length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Outras avaliações:</h4>
          {reviews
            .filter(review => review.user_id !== user?.id)
            .map((review) => (
              <Card key={review.id} className="bg-secondary/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {(review as any).profiles?.nome_completo || 'Cliente'}
                        </span>
                        {renderStars(review.rating)}
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('pt-BR')}
                      </p>
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