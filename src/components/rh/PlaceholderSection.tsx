import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PlaceholderSection: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-center text-muted-foreground py-8">{description}</p>
    </CardContent>
  </Card>
);
