
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
}

const DashboardCard = ({
  title,
  description,
  icon: Icon,
  count,
  linkTo,
  linkText,
}: DashboardCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
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
          className="text-primary hover:underline text-sm flex items-center"
        >
          {linkText}
        </Link>
      </CardFooter>
    </Card>
  );
};

export default DashboardCard;
