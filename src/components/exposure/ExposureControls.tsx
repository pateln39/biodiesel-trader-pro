
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { exportExposureToExcel, exportExposureByTrade } from '@/utils/excelExportUtils';
import { MonthlyExposure, GrandTotals, GroupTotals } from '@/types/exposure';

interface ExposureControlsProps {
  visibleCategories: string[];
  toggleCategory: (category: string) => void;
  exposureCategories: readonly string[];
  onExportExcel: () => void;
  onExportByTrade: () => void;
}

const ExposureControls: React.FC<ExposureControlsProps> = ({
  visibleCategories,
  toggleCategory,
  exposureCategories,
  onExportExcel,
  onExportByTrade
}) => {
  return (
    <div className="flex justify-between items-center">
      <Card className="mb-4 w-full">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category Filters</label>
              <div className="flex flex-wrap gap-2">
                {exposureCategories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`category-${category}`} 
                      checked={visibleCategories.includes(category)} 
                      onCheckedChange={() => toggleCategory(category)} 
                    />
                    <label 
                      htmlFor={`category-${category}`} 
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex space-x-2 ml-4">
        <Button variant="outline" size="sm" onClick={onExportByTrade}>
          <Download className="mr-2 h-3 w-3" /> Export by Trade
        </Button>
        <Button variant="outline" size="sm" onClick={onExportExcel}>
          <Download className="mr-2 h-3 w-3" /> Export
        </Button>
      </div>
    </div>
  );
};

export default ExposureControls;
