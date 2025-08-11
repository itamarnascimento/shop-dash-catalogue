import HeroCarousel from '@/components/HeroCarousel';
import { ShoppingBag, Zap } from 'lucide-react';
import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary">
      <div className="container mx-auto px-4 py-10 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Novos produtos chegando</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                A melhor qualidade em,
                <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  {" "}Sublimação{" "}
                </span>
                feita para você!
              </h1>

              <p className="text-xl text-muted-foreground max-w-lg">
                Transforme suas ideias em produtos únicos com sublimação de alta qualidade e o melhor preço do mercado.
              </p>
            </div>

            {/* <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Explorar Produtos
              </Button>
              
              <Button variant="outline" size="lg">
                Ver Ofertas
              </Button>
            </div> */}

            {/* Stats */}
            <div className="flex items-center space-x-8 pt-8">
              <div>
                <div className="text-2xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Produtos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Clientes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">4.8★</div>
                <div className="text-sm text-muted-foreground">Avaliação</div>
              </div>
            </div>
          </div>

          {/* Image Carousel */}
          <div className="relative">
            <div className="relative shadow-2xl">
              <HeroCarousel />
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 bg-card/95 backdrop-blur-md border border-border rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-blue-500 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Entrega Grátis</div>
                  <div className="text-sm text-muted-foreground">Em compras acima de R$ 50</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;