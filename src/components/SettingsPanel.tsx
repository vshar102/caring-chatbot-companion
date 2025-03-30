
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, X } from 'lucide-react';

interface SettingsPanelProps {
  onSave: (apiKey: string, voiceId: string) => void;
  initialApiKey: string;
  initialVoiceId: string;
}

interface Voice {
  id: string;
  name: string;
  description: string;
}

const AVAILABLE_VOICES: Voice[] = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Friendly female voice" },
  { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", description: "Professional male voice" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Casual male voice" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", description: "Cheerful female voice" },
];

const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  onSave, 
  initialApiKey, 
  initialVoiceId 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [voiceId, setVoiceId] = useState(initialVoiceId);
  
  const handleSave = () => {
    onSave(apiKey, voiceId);
    setIsOpen(false);
  };
  
  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        variant="outline" 
        className="absolute top-4 right-4"
      >
        <Settings className="h-5 w-5" />
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <Card className="w-full max-w-md relative">
            <Button 
              onClick={() => setIsOpen(false)} 
              variant="ghost" 
              className="absolute top-2 right-2 p-2 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <CardHeader>
              <CardTitle>Healthcare Assistant Settings</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">ElevenLabs API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your ElevenLabs API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://elevenlabs.io/" target="_blank" rel="noopener noreferrer" className="text-healthcare-primary hover:underline">ElevenLabs</a>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voice">Voice Selection</Label>
                <Select value={voiceId} onValueChange={setVoiceId}>
                  <SelectTrigger id="voice">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {AVAILABLE_VOICES.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name} - {voice.description}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleSave} 
                  className="w-full bg-healthcare-primary hover:bg-healthcare-dark"
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default SettingsPanel;
