
import React from 'react';
import { HealthcareProvider } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, MapPin, Phone } from 'lucide-react';

interface HealthcareProvidersProps {
  providers: HealthcareProvider[];
}

const HealthcareProviders: React.FC<HealthcareProvidersProps> = ({ providers }) => {
  if (providers.length === 0) {
    return (
      <div className="py-3 px-4 bg-muted/50 rounded-md">
        <p>No healthcare providers found in this area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Nearby Healthcare Providers:</h3>
      <div className="space-y-3">
        {providers.map((provider, index) => (
          <Card key={index} className="overflow-hidden border border-muted">
            <CardHeader className="py-3 px-4 bg-muted/20">
              <CardTitle className="text-sm font-medium flex justify-between">
                <span>{provider.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{provider.distance}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-4 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <span>{provider.address}</span>
              </div>
              {provider.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{provider.phone}</span>
                </div>
              )}
              {provider.website && (
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  <a 
                    href={provider.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-healthcare-primary hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HealthcareProviders;
