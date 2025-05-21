
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

export type ColorOption = {
  name: string;
  class: string;
  textClass: string;
};

// Available color options for products
export const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Blue', class: 'bg-blue-500', textClass: 'text-white' },
  { name: 'Green', class: 'bg-green-500', textClass: 'text-white' },
  { name: 'Purple', class: 'bg-purple-500', textClass: 'text-white' },
  { name: 'Orange', class: 'bg-orange-500', textClass: 'text-white' },
  { name: 'Red', class: 'bg-red-500', textClass: 'text-white' },
  { name: 'Yellow', class: 'bg-yellow-500', textClass: 'text-black' },
  { name: 'Violet', class: 'bg-violet-600', textClass: 'text-white' },
  { name: 'Teal', class: 'bg-teal-500', textClass: 'text-white' },
  { name: 'Emerald', class: 'bg-emerald-500', textClass: 'text-white' },
  { name: 'Pink', class: 'bg-pink-500', textClass: 'text-white' },
  { name: 'Indigo', class: 'bg-indigo-500', textClass: 'text-white' },
  { name: 'Cyan', class: 'bg-cyan-500', textClass: 'text-white' },
  { name: 'Rose', class: 'bg-rose-500', textClass: 'text-white' },
  { name: 'Amber', class: 'bg-amber-500', textClass: 'text-black' },
  { name: 'Lime', class: 'bg-lime-500', textClass: 'text-black' },
];

interface ColorSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const ColorSelect: React.FC<ColorSelectProps> = ({ value, onChange, label }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a color">
          {value && (
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${COLOR_OPTIONS.find(c => c.name === value)?.class || ''}`}></div>
              {value}
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {COLOR_OPTIONS.map((color) => (
          <SelectItem 
            key={color.name} 
            value={color.name}
            className="flex items-center"
          >
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full mr-2 ${color.class}`}></div>
              {color.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ColorSelect;
