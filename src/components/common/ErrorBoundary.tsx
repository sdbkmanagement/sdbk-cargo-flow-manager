import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage?: string;
};

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error('🧯 ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Une erreur est survenue</CardTitle>
            <CardDescription>
              L’application a rencontré un problème. Vous pouvez recharger la page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.errorMessage && (
              <pre className="text-xs rounded-md bg-muted p-3 overflow-auto max-h-40">
                {this.state.errorMessage}
              </pre>
            )}
            <div className="flex justify-end">
              <Button onClick={this.handleReload}>Recharger</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
