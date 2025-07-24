
import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { CreateAdminButton } from '@/components/admin/CreateAdminButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Auth = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <div className="w-full max-w-md space-y-6">
        <LoginForm />
        
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Configuration Admin</CardTitle>
            <CardDescription>
              Créer le compte administrateur par défaut
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CreateAdminButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
