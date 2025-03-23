// Import from the original location src/components/pricing/PriceDetails.tsx
// Update imports to use the new module structure
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculatePriceFromFormula } from '@/modules/pricing/utils/priceCalculationUtils';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formulaToDisplayString } from '@/modules/pricing/utils/formulaUtils';

interface PriceDetailsProps {
  id?: string;
}

const PriceDetails: React.FC<PriceDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [price, setPrice] = useState<number | null>(null);
  const [formulaDisplay, setFormulaDisplay] = useState<string>('');
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);

  const { data: pricingData, isLoading, isError } = useQuery(
    ['pricingData', id],
    async () => {
      if (!id) {
        throw new Error('ID is required to fetch pricing data');
      }

      const { data, error } = await supabase
        .from('pricing_data')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }
  );

  useEffect(() => {
    if (pricingData && pricingData.formula) {
      try {
        const calculatedPrice = calculatePriceFromFormula(pricingData.formula);
        setPrice(calculatedPrice);
        setFormulaDisplay(formulaToDisplayString(pricingData.formula.tokens));
      } catch (error) {
        console.error("Error calculating price:", error);
        setPrice(null);
        setFormulaDisplay('Error in formula');
      }
    } else {
      setPrice(null);
      setFormulaDisplay('');
    }
  }, [pricingData]);

  const handleGoBack = () => {
    navigate('/risk/prices');
  };

  const handleOverrideToggle = () => {
    setIsOverrideEnabled(!isOverrideEnabled);
  };

  const handleOverrideValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOverrideValue(e.target.value);
  };

  const getFinalPrice = () => {
    if (isOverrideEnabled && overrideValue) {
      return overrideValue;
    }
    return price !== null ? price.toFixed(2) : 'N/A';
  };

  if (isLoading) {
    return <div>Loading price details...</div>;
  }

  if (isError) {
    return <div>Error loading price details.</div>;
  }

  if (!pricingData) {
    return <div>Price data not found.</div>;
  }

  return (
    <div className="container mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Price Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Instrument:</Label>
            <Input type="text" value={pricingData.instrument} readOnly />
          </div>
          <div className="mb-4">
            <Label>Date:</Label>
            <Input type="text" value={pricingData.date} readOnly />
          </div>
          <div className="mb-4">
            <Label>Formula:</Label>
            <Input type="text" value={formulaDisplay} readOnly />
          </div>
          <div className="mb-4">
            <Label>Calculated Price:</Label>
            <Input type="text" value={price !== null ? price.toFixed(2) : 'N/A'} readOnly />
          </div>
          <div className="mb-4">
            <Label>
              Override Price:
              <Input
                type="checkbox"
                checked={isOverrideEnabled}
                onChange={handleOverrideToggle}
                className="ml-2"
              />
            </Label>
            <Input
              type="number"
              placeholder="Enter override value"
              value={overrideValue}
              onChange={handleOverrideValueChange}
              disabled={!isOverrideEnabled}
            />
          </div>
          <div className="mb-4">
            <Label>Final Price:</Label>
            <Input type="text" value={getFinalPrice()} readOnly />
          </div>
          <Button onClick={handleGoBack}>Go Back</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceDetails;
