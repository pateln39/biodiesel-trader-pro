
import React from 'react';
import {
  FormControl,
  FormDescription,
  FormField as UIFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFormContext } from 'react-hook-form';

interface FormFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  placeholder,
  description,
  type = 'text',
  required = false,
  disabled = false,
  children,
}) => {
  const form = useFormContext();

  return (
    <UIFormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </FormLabel>
          <FormControl>
            {children || (
              <Input
                {...field}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                value={field.value || ''}
              />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
