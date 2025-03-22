
import React, { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FormLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  defaultValues?: Record<string, any>;
  onSubmit?: (data: any) => void;
}

export const FormLayout: React.FC<FormLayoutProps> = ({
  title,
  description,
  children,
  actions,
}) => {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        {actions && (
          <div className="flex justify-end p-6 pt-0 gap-2">
            {actions}
          </div>
        )}
      </Card>
    </div>
  );
};
