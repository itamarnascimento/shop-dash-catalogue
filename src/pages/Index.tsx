import CartDrawer from '@/components/CartDrawer';
import CategoryFilter from '@/components/CategoryFilter';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ProductGrid from '@/components/ProductGrid';
import { loadProducts } from '@/data/products';
import { ProductDB } from '@/types/database';
import { useEffect, useMemo, useState } from 'react';

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<ProductDB[]>([]);
  useMemo(() => {
    setProducts(products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }));
  }, [searchQuery, selectedCategory]);

  const getProducts = async () => {
    const data = await loadProducts()
    setProducts(data || [])
  }
  useEffect(() => {
    getProducts()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSearchChange={setSearchQuery}
        onCartClick={() => setIsCartOpen(true)}
        visibleSearchBar={true}
      />

      <HeroSection />

      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Category Filter */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Nossos Produtos</h2>
            <p className="text-muted-foreground">Encontre exatamente o que você precisa</p>
          </div>

          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </section>

        {/* Products Grid */}
        <section>
          <ProductGrid products={products} />
        </section>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};

export default Index;
