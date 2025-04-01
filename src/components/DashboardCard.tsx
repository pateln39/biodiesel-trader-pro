
import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  count?: number;
  linkTo: string;
  linkText: string;
  className?: string;
}

const DashboardCard = ({
  title,
  description,
  icon: Icon,
  count,
  linkTo,
  linkText,
  className,
}: DashboardCardProps) => {
  return (
    <Card className={`h-full text-white ${className || 'bg-brand-navy border-brand-blue/30'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-brand-lime" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {count !== undefined ? count : '-'}
        </div>
        <p className="text-xs text-muted-foreground mt-2">{description}</p>
      </CardContent>
      <CardFooter>
        <Link 
          to={linkTo}
          className="text-brand-lime hover:underline text-sm flex items-center"
        >
          {linkText}
        </Link>
      </CardFooter>
    </Card>
  );
};

export default DashboardCard;
