import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  PhysicalTrade, PhysicalTradeLeg, TradeType, BuySell, Product, 
  IncoTerm, Unit, PaymentTerm, CreditStatus
} from '@/modules/trade/types';
import { FormulaBuilder } from '@/modules/trade/components';
import { generateLegReference } from '@/modules/trade/utils/tradeUtils';
import { toast } from 'sonner';
import { 
  createEmptyFormula 
} from '@/modules/pricing/utils/formulaUtils';
import { 
  validatePhysicalTradeForm 
} from '@/modules/trade/utils/validationUtils';

interface PhysicalTradeFormProps {
  tradeReference: string;
  onSubmit: (trade: any) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: PhysicalTrade;
}

const PhysicalTradeForm: React.FC<PhysicalTradeFormProps> = ({
  tradeReference,
  onSubmit,
  onCancel,
  isEditMode = false,
  initialData
}) => {
  const [counterparty, setCounterparty] = useState(initialData?.counterparty || '');
  const [comments, setComments] = useState(initialData?.comment || '');
  const [physicalType, setPhysicalType] = useState<PhysicalType>(initialData?.physicalType || 'spot');
  const [tradeLegs, setTradeLegs] = useState<PhysicalTradeLeg[]>(initialData?.legs || [
    {
      legReference: generateLegReference(tradeReference, 0),
      buySell: 'buy',
      product: '',
      quantity: 0,
      unit: 'MT',
      price: 0,
      incoTerm: 'FCA',
      period: '',
      broker: '',
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula()
    }
  ]);

  const handleLegsChange = (newLegs: PhysicalTradeLeg[]) => {
    setTradeLegs(newLegs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhysicalTradeForm(counterparty, tradeLegs)) {
      return;
    }

    const tradeData: PhysicalTrade = {
      id: initialData?.id || '',
      tradeReference,
      tradeType: 'physical',
      physicalType,
      counterparty,
      comment: comments,
      legs: tradeLegs.map((leg, index) => ({
        ...leg,
        legReference: initialData?.legs?.[index]?.legReference || generateLegReference(tradeReference, index)
      }))
    };

    onSubmit(tradeData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="counterparty">Counterparty</Label>
          <Input
            id="counterparty"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
            placeholder="Enter counterparty name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Comment</Label>
          <Textarea
            id="comment"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter optional comment"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="physical-type">Physical Type</Label>
          <Select value={physicalType} onValueChange={(value) => setPhysicalType(value as PhysicalType)}>
            <SelectTrigger id="physical-type">
              <SelectValue placeholder="Select physical type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spot">Spot</SelectItem>
              <SelectItem value="term">Term</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Trade Legs</h3>
        <PhysicalTradeLegsTable
          legs={tradeLegs}
          onLegsChange={handleLegsChange}
          tradeReference={tradeReference}
        />
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditMode ? 'Update Trade' : 'Create Trade'}
        </Button>
      </div>
    </form>
  );
};

interface PhysicalTradeLegsTableProps {
  legs: PhysicalTradeLeg[];
  onLegsChange: (legs: PhysicalTradeLeg[]) => void;
  tradeReference: string;
}

const PhysicalTradeLegsTable: React.FC<PhysicalTradeLegsTableProps> = ({ legs, onLegsChange, tradeReference }) => {
  const [tradeLegs, setTradeLegs] = useState<PhysicalTradeLeg[]>(legs);

  useEffect(() => {
    setTradeLegs(legs);
  }, [legs]);

  const handleAddLeg = () => {
    const newLeg: PhysicalTradeLeg = {
      legReference: generateLegReference(tradeReference, tradeLegs.length),
      buySell: 'buy',
      product: '',
      quantity: 0,
      unit: 'MT',
      price: 0,
      incoTerm: 'FCA',
      period: '',
      broker: '',
      formula: createEmptyFormula(),
      mtmFormula: createEmptyFormula()
    };

    setTradeLegs([...tradeLegs, newLeg]);
    onLegsChange([...tradeLegs, newLeg]);
  };

  const handleRemoveLeg = (index: number) => {
    const newLegs = [...tradeLegs];
    newLegs.splice(index, 1);
    setTradeLegs(newLegs);
    onLegsChange(newLegs);
  };

  const handleLegChange = (index: number, field: string, value: any) => {
    const newLegs = [...tradeLegs];
    newLegs[index][field] = value;
    setTradeLegs(newLegs);
    onLegsChange(newLegs);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Buy/Sell
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inco Term
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Broker
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tradeLegs.map((leg, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {leg.legReference}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Select value={leg.buySell} onValueChange={(value) => handleLegChange(index, 'buySell', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Input
                    type="text"
                    value={leg.product}
                    onChange={(e) => handleLegChange(index, 'product', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Input
                    type="number"
                    value={leg.quantity}
                    onChange={(e) => handleLegChange(index, 'quantity', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Select value={leg.unit} onValueChange={(value) => handleLegChange(index, 'unit', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MT">MT</SelectItem>
                      <SelectItem value="BBL">BBL</SelectItem>
                      <SelectItem value="GAL">GAL</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Input
                    type="number"
                    value={leg.price}
                    onChange={(e) => handleLegChange(index, 'price', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Select value={leg.incoTerm} onValueChange={(value) => handleLegChange(index, 'incoTerm', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FCA">FCA</SelectItem>
                      <SelectItem value="CIF">CIF</SelectItem>
                      <SelectItem value="DAP">DAP</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Input
                    type="text"
                    value={leg.period}
                    onChange={(e) => handleLegChange(index, 'period', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Input
                    type="text"
                    value={leg.broker}
                    onChange={(e) => handleLegChange(index, 'broker', e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button variant="outline" size="sm" onClick={() => handleRemoveLeg(index)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" variant="outline" onClick={handleAddLeg}>
        Add Leg
      </Button>
    </div>
  );
};

export default PhysicalTradeForm;
