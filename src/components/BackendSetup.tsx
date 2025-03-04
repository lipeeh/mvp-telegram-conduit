
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type BackendSetupProps = {
  onComplete: () => void;
};

const BackendSetup: React.FC<BackendSetupProps> = ({ onComplete }) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installComplete, setInstallComplete] = useState(false);
  const [installFailed, setInstallFailed] = useState(false);
  const [useDocker, setUseDocker] = useState(true);
  
  const handleInstall = () => {
    setIsInstalling(true);
    setInstallProgress(0);
    
    // Simulate installation process
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setInstallComplete(true);
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configuração do Backend</CardTitle>
        <CardDescription>
          Configure o servidor da API Telegram Conduit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isInstalling && !installComplete && !installFailed && (
          <>
            <div className="space-y-4">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Informação importante</AlertTitle>
                <AlertDescription>
                  Este processo irá configurar o backend necessário para a API Telegram Conduit.
                  Você precisará de Node.js instalado no seu servidor.
                </AlertDescription>
              </Alert>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="useDocker" 
                  checked={useDocker} 
                  onCheckedChange={(checked) => setUseDocker(!!checked)} 
                />
                <Label htmlFor="useDocker">Usar Docker (recomendado)</Label>
              </div>
              
              {useDocker ? (
                <div className="bg-gray-100 p-3 rounded-md text-sm font-mono">
                  <p className="mb-2"># Clone o repositório</p>
                  <p>git clone https://github.com/user/telegram-conduit-api.git</p>
                  <p>cd telegram-conduit-api</p>
                  <p className="mb-2 mt-2"># Inicie com Docker Compose</p>
                  <p>docker-compose up -d</p>
                </div>
              ) : (
                <div className="bg-gray-100 p-3 rounded-md text-sm font-mono">
                  <p className="mb-2"># Clone o repositório</p>
                  <p>git clone https://github.com/user/telegram-conduit-api.git</p>
                  <p>cd telegram-conduit-api</p>
                  <p className="mb-2 mt-2"># Instale as dependências</p>
                  <p>npm install</p>
                  <p className="mb-2 mt-2"># Inicie o servidor</p>
                  <p>npm start</p>
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">Requisitos do sistema:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Node.js 14 ou superior</li>
                <li>2GB RAM mínimo</li>
                <li>5GB de espaço em disco</li>
                {useDocker && (
                  <>
                    <li>Docker 19 ou superior</li>
                    <li>Docker Compose v2</li>
                  </>
                )}
              </ul>
            </div>
          </>
        )}
        
        {isInstalling && !installComplete && !installFailed && (
          <div className="space-y-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${installProgress}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Instalando componentes ({Math.round(installProgress)}%)</p>
            </div>
            <div className="bg-black text-green-400 p-3 rounded-md font-mono text-sm h-40 overflow-y-auto">
              <p>$ npm install tdlib-bindings</p>
              <p>$ Baixando dependências...</p>
              <p>$ Compilando biblioteca nativa...</p>
              <p>$ Configurando ambiente...</p>
              {installProgress > 30 && <p>$ Instalando pacotes adicionais...</p>}
              {installProgress > 50 && <p>$ Configurando autenticação...</p>}
              {installProgress > 70 && <p>$ Preparando sistema de arquivos...</p>}
              {installProgress > 85 && <p>$ Finalizando instalação...</p>}
              {installProgress >= 100 && <p>$ Instalação concluída!</p>}
            </div>
          </div>
        )}
        
        {installComplete && (
          <div className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <AlertTitle className="text-green-800">Instalação concluída!</AlertTitle>
              <AlertDescription className="text-green-700">
                O backend da API Telegram Conduit foi configurado com sucesso.
              </AlertDescription>
            </Alert>
            
            <div className="bg-gray-100 p-3 rounded-md text-sm">
              <p className="font-medium">Próximos passos:</p>
              <ol className="list-decimal pl-5 mt-2 space-y-1">
                <li>Conecte-se à sua conta do Telegram</li>
                <li>Copie a API Key gerada</li>
                <li>Configure o N8N para usar a API</li>
              </ol>
            </div>
          </div>
        )}
        
        {installFailed && (
          <Alert variant="destructive">
            <AlertTitle>Falha na instalação</AlertTitle>
            <AlertDescription>
              Ocorreu um erro durante a instalação. Por favor, verifique os logs e tente novamente.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        {!isInstalling && !installComplete && (
          <Button onClick={handleInstall} className="w-full">
            Iniciar Instalação
          </Button>
        )}
        
        {installComplete && (
          <Button onClick={onComplete} className="w-full">
            Continuar para API
          </Button>
        )}
        
        {installFailed && (
          <Button onClick={handleInstall} variant="outline" className="w-full">
            Tentar Novamente
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default BackendSetup;
