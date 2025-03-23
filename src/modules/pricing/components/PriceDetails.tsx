
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

// Define the pricing data interface
interface PricingData {
  id: string;
  instrument: string;
  date: string;
  formula: any;
}

const PriceDetails: React.FC<PriceDetailsProps> = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [price, setPrice] = useState<number | null>(null);
  const [formulaDisplay, setFormulaDisplay] = useState<string>('');
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [isOverrideEnabled, setIsOverrideEnabled] = useState(false);

  const { data: pricingData, isLoading, isError } = useQuery({
    queryKey: ['pricingData', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('ID is required to fetch pricing data');
      }

      // Fetch from historical_prices instead of the non-existent 'prices' table
      const { data: histPrice, error: histPriceError } = await supabase
        .from('historical_prices')
        .select(`
          id, 
          price_date as date, 
          price,
          pricing_instruments(instrument_code, display_name)
        `)
        .eq('id', id)
        .single();

      if (histPriceError) {
        // Try forward prices table as an alternative
        const { data: fwdPrice, error: fwdPriceError } = await supabase
          .from('forward_prices')
          .select(`
            id, 
            forward_month as date, 
            price,
            pricing_instruments(instrument_code, display_name)
          `)
          .eq('id', id)
          .single();

        if (fwdPriceError) {
          throw new Error('Price data not found');
        }

        return {
          id: fwdPrice.id,
          instrument: fwdPrice.pricing_instruments?.instrument_code || 'Unknown',
          date: fwdPrice.date,
          formula: null // Forward prices typically don't have formulas
        };
      }

      return {
        id: histPrice.id,
        instrument: histPrice.pricing_instruments?.instrument_code || 'Unknown',
        date: histPrice.date,
        formula: null // Historical prices typically don't have formulas stored
      };
    }
  });

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
    } else if (pricingData) {
      // If we don't have a formula, just use the price directly
      setPrice(pricingData.price);
      setFormulaDisplay('No formula available');
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
