
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Shield, Copy, RefreshCw } from "lucide-react";

interface ApiKeyDisplayProps {
  apiKey: string;
  onRegenerateKey?: () => void;
  onDelete?: () => void;
}

const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({ 
  apiKey, 
  onRegenerateKey,
  onDelete
}) => {
  const { toast } = useToast();
  const [isRevealed, setIsRevealed] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key copiada!",
      description: "A chave foi copiada para a área de transferência."
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <CardTitle>Sua API Key</CardTitle>
          </div>
        </div>
        <CardDescription>
          Use esta chave para autenticar solicitações à API do Telegram
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex">
              <Input
                id="apiKey"
                type={isRevealed ? "text" : "password"}
                value={apiKey}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsRevealed(!isRevealed)}
                className="ml-2"
              >
                {isRevealed ? "Ocultar" : "Mostrar"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyToClipboard}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
            <p className="text-amber-800 text-sm">
              <strong>Importante:</strong> Mantenha esta chave segura. Ela fornece acesso total à sua conta do Telegram através da API.
            </p>
          </div>
          
          <div className="bg-gray-100 p-3 rounded-md text-sm">
            <p className="font-medium mb-2">Como utilizar:</p>
            <pre className="overflow-x-auto text-xs">
              {`curl https://seu-dominio.com/api/chats \\
  -H "X-API-Key: ${apiKey}"`}
            </pre>
          </div>
        </div>
      </CardContent>
      {(onRegenerateKey || onDelete) && (
        <CardFooter className="flex justify-between">
          {onDelete && (
            <Button variant="outline" onClick={onDelete} className="text-red-500">
              Revogar chave
            </Button>
          )}
          {onRegenerateKey && (
            <Button onClick={onRegenerateKey} className="ml-auto">
              <RefreshCw className="mr-2 h-4 w-4" /> Gerar nova chave
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ApiKeyDisplay;
