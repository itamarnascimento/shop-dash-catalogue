import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Categories } from '@/types/database';
import { loadCategories } from '@/data/categories';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

 const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  const [categories, setCategories] = useState<Categories[]>([])
  const getCategories = async () => {
    const data = await loadCategories()
    setCategories(data || [])
  }

  useEffect(() => { getCategories() }, [])

  return (
    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
      <Button
        key={1}
        variant={selectedCategory === 'Todos' ? "default" : "outline"}
        onClick={() => onCategoryChange('Todos')}
        className={
          selectedCategory === 'Todos'
            ? "bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            : ""
        }
      >
        Todos
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.name ? "default" : "outline"}
          onClick={() => onCategoryChange(category.name)}
          className={
            selectedCategory === category.name
              ? "bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
              : ""
          }
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};


export default CategoryFilter;