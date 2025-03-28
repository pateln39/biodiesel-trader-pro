
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";

interface ExposureCategoryFilterProps {
  visibleCategories: string[];
  toggleCategory: (category: string) => void;
}

const ExposureCategoryFilter: React.FC<ExposureCategoryFilterProps> = ({ 
  visibleCategories, 
  toggleCategory 
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="physical-toggle"
              checked={visibleCategories.includes('Physical')}
              onCheckedChange={() => toggleCategory('Physical')}
            />
            <label
              htmlFor="physical-toggle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Physical
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="pricing-toggle"
              checked={visibleCategories.includes('Pricing')}
              onCheckedChange={() => toggleCategory('Pricing')}
            />
            <label
              htmlFor="pricing-toggle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Pricing
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="paper-toggle" 
              checked={visibleCategories.includes('Paper')}
              onCheckedChange={() => toggleCategory('Paper')}
            />
            <label
              htmlFor="paper-toggle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Paper
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="exposure-toggle"
              checked={visibleCategories.includes('Exposure')}
              onCheckedChange={() => toggleCategory('Exposure')}
            />
            <label
              htmlFor="exposure-toggle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Net Exposure
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExposureCategoryFilter;
