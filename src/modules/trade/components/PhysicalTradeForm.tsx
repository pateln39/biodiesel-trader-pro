import React from 'react';
// Update imports with the new module structure
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTrade } from '@/modules/trade/types';

interface PhysicalTradeFormProps {
  onSubmit: (data: PhysicalTrade) => void;
  onCancel: () => void;
  isEditMode?: boolean;
  initialData?: PhysicalTrade;
}

const PhysicalTradeForm: React.FC<PhysicalTradeFormProps> = ({ onSubmit, onCancel, isEditMode = false, initialData }) => {
  const [tradeReference, setTradeReference] = React.useState(initialData?.tradeReference || '');
  const [counterparty, setCounterparty] = React.useState(initialData?.counterparty || '');
  const [product, setProduct] = React.useState(initialData?.product || '');
  const [quantity, setQuantity] = React.useState(initialData?.quantity || 0);
  const [unit, setUnit] = React.useState(initialData?.unit || 'MT');
  const [price, setPrice] = React.useState(initialData?.price || 0);
  const [currency, setCurrency] = React.useState(initialData?.currency || 'USD');
  const [deliveryLocation, setDeliveryLocation] = React.useState(initialData?.deliveryLocation || '');
  const [deliveryStartDate, setDeliveryStartDate] = React.useState(initialData?.deliveryStartDate || '');
  const [deliveryEndDate, setDeliveryEndDate] = React.useState(initialData?.deliveryEndDate || '');
  const [paymentTerms, setPaymentTerms] = React.useState(initialData?.paymentTerms || '');
  const [incoterms, setIncoterms] = React.useState(initialData?.incoterms || '');
  const [shippingCompany, setShippingCompany] = React.useState(initialData?.shippingCompany || '');
  const [vessel, setVessel] = React.useState(initialData?.vessel || '');
  const [laycanStartDate, setLaycanStartDate] = React.useState(initialData?.laycanStartDate || '');
  const [laycanEndDate, setLaycanEndDate] = React.useState(initialData?.laycanEndDate || '');
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [isConfirmed, setIsConfirmed] = React.useState(initialData?.isConfirmed || false);
  const [isCancelled, setIsCancelled] = React.useState(initialData?.isCancelled || false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tradeData = {
      tradeReference,
      counterparty,
      product,
      quantity,
      unit,
      price,
      currency,
      deliveryLocation,
      deliveryStartDate,
      deliveryEndDate,
      paymentTerms,
      incoterms,
      shippingCompany,
      vessel,
      laycanStartDate,
      laycanEndDate,
      attachments,
      isConfirmed,
      isCancelled,
    };

    onSubmit(tradeData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Physical Trade' : 'Create Physical Trade'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tradeReference">Trade Reference</Label>
              <Input
                type="text"
                id="tradeReference"
                value={tradeReference}
                onChange={(e) => setTradeReference(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="counterparty">Counterparty</Label>
              <Input
                type="text"
                id="counterparty"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Product</Label>
              <Input
                type="text"
                id="product"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MT">MT</SelectItem>
                  <SelectItem value="BBL">BBL</SelectItem>
                  <SelectItem value="GAL">GAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                type="number"
                id="price"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="deliveryLocation">Delivery Location</Label>
              <Input
                type="text"
                id="deliveryLocation"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deliveryStartDate">Delivery Start Date</Label>
              <Input
                type="date"
                id="deliveryStartDate"
                value={deliveryStartDate}
                onChange={(e) => setDeliveryStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="deliveryEndDate">Delivery End Date</Label>
              <Input
                type="date"
                id="deliveryEndDate"
                value={deliveryEndDate}
                onChange={(e) => setDeliveryEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                type="text"
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="incoterms">Incoterms</Label>
              <Input
                type="text"
                id="incoterms"
                value={incoterms}
                onChange={(e) => setIncoterms(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shippingCompany">Shipping Company</Label>
              <Input
                type="text"
                id="shippingCompany"
                value={shippingCompany}
                onChange={(e) => setShippingCompany(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="vessel">Vessel</Label>
              <Input
                type="text"
                id="vessel"
                value={vessel}
                onChange={(e) => setVessel(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="laycanStartDate">Laycan Start Date</Label>
              <Input
                type="date"
                id="laycanStartDate"
                value={laycanStartDate}
                onChange={(e) => setLaycanStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="laycanEndDate">Laycan End Date</Label>
              <Input
                type="date"
                id="laycanEndDate"
                value={laycanEndDate}
                onChange={(e) => setLaycanEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="attachments">Attachments</Label>
            <Input
              type="file"
              id="attachments"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setAttachments(Array.from(e.target.files));
                }
              }}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="isConfirmed">Confirmed</Label>
            <Switch
              id="isConfirmed"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="isCancelled">Cancelled</Label>
            <Switch
              id="isCancelled"
              checked={isCancelled}
              onCheckedChange={(checked) => setIsCancelled(checked)}
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
      </CardContent>
    </Card>
  );
};

export default PhysicalTradeForm;
