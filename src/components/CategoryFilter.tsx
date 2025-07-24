import React from 'react';
import { Button } from '@/components/ui/button';
import { categories } from '@/data/products';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => onCategoryChange(category)}
          className={
            selectedCategory === category
              ? "bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
              : ""
          }
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;