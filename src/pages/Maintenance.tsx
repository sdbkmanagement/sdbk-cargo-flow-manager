import React from 'react';
import { Wrench, Clock, AlertCircle } from 'lucide-react';

const Maintenance: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/30 to-background p-4">
      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in">
        {/* Icône principale avec animation */}
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="relative bg-card border-2 border-primary/20 rounded-full p-8 inline-block shadow-elegant">
            <Wrench className="w-20 h-20 text-primary animate-pulse" />
          </div>
        </div>

        {/* Titre et message */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Maintenance en cours
          </h1>
          <p className="text-xl text-muted-foreground">
            Nous améliorons votre expérience
          </p>
        </div>

        {/* Informations détaillées */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-medium space-y-4 max-w-md mx-auto">
          <div className="flex items-start gap-3 text-left">
            <Clock className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Durée estimée</p>
              <p className="text-sm text-muted-foreground">Quelques instants</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Service temporairement indisponible</p>
              <p className="text-sm text-muted-foreground">
                Notre équipe travaille activement pour rétablir le service. 
                Merci de votre patience.
              </p>
            </div>
          </div>
        </div>

        {/* Message de contact */}
        <p className="text-sm text-muted-foreground">
          Pour toute urgence, veuillez contacter le support technique
        </p>

        {/* Animation de chargement */}
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
