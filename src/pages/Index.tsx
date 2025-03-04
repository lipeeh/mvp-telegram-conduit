
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [authState, setAuthState] = useState('initial'); // initial, awaitingCode, awaitingPassword, authenticated
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('telegram-api-key') || '');
  const [serverStatus, setServerStatus] = useState('disconnected');
  const { toast } = useToast();

  useEffect(() => {
    // Check if API key exists and verify connection
    if (apiKey) {
      checkServerStatus();
    }
  }, [apiKey]);

  const checkServerStatus = async () => {
    try {
      setLoading(true);
      // This would call the API status endpoint in a real implementation
      // For now, we'll simulate a connected state
      setTimeout(() => {
        setServerStatus('connected');
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to check server status:', error);
      setServerStatus('disconnected');
      setLoading(false);
      toast({
        title: "Erro ao verificar status",
        description: "Não foi possível conectar ao servidor da API Telegram.",
        variant: "destructive"
      });
    }
  };

  const handleSendPhoneNumber = async () => {
    try {
      setLoading(true);
      // This would call the API to send the verification code in a real implementation
      // For now, we'll simulate a successful response
      setTimeout(() => {
        setAuthState('awaitingCode');
        setLoading(false);
        toast({
          title: "Código enviado",
          description: "Verifique seu Telegram para o código de verificação."
        });
      }, 1500);
    } catch (error) {
      console.error('Failed to send phone number:', error);
      setLoading(false);
      toast({
        title: "Erro ao enviar número",
        description: "Não foi possível enviar o código de verificação.",
        variant: "destructive"
      });
    }
  };

  const handleVerifyCode = async () => {
    try {
      setLoading(true);
      // This would call the API to verify the code in a real implementation
      // For now, we'll simulate a successful response or 2FA requirement
      setTimeout(() => {
        if (Math.random() > 0.5) {
          setAuthState('authenticated');
          const newApiKey = 'sim-api-key-' + Date.now();
          setApiKey(newApiKey);
          localStorage.setItem('telegram-api-key', newApiKey);
          setServerStatus('connected');
        } else {
          setAuthState('awaitingPassword');
        }
        setLoading(false);
        toast({
          title: "Código verificado",
          description: authState === 'authenticated' 
            ? "Autenticação concluída com sucesso!" 
            : "É necessário fornecer a senha de dois fatores."
        });
      }, 1500);
    } catch (error) {
      console.error('Failed to verify code:', error);
      setLoading(false);
      toast({
        title: "Erro ao verificar código",
        description: "O código fornecido é inválido ou expirou.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitPassword = async () => {
    try {
      setLoading(true);
      // This would call the API to verify the 2FA password in a real implementation
      // For now, we'll simulate a successful response
      setTimeout(() => {
        setAuthState('authenticated');
        const newApiKey = 'sim-api-key-' + Date.now();
        setApiKey(newApiKey);
        localStorage.setItem('telegram-api-key', newApiKey);
        setServerStatus('connected');
        setLoading(false);
        toast({
          title: "Autenticação concluída",
          description: "Você está autenticado com o Telegram."
        });
      }, 1500);
    } catch (error) {
      console.error('Failed to verify password:', error);
      setLoading(false);
      toast({
        title: "Erro ao verificar senha",
        description: "A senha fornecida é inválida.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    setAuthState('initial');
    setApiKey('');
    setServerStatus('disconnected');
    localStorage.removeItem('telegram-api-key');
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado do Telegram."
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">API Telegram Conduit</h1>
        <p className="text-gray-600">Conecte o Telegram com N8N através de uma API simples</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status do Servidor</CardTitle>
            <CardDescription>
              Estado atual da conexão com o servidor da API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${
                  serverStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="font-medium">
                {serverStatus === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            {apiKey && (
              <div className="mt-4">
                <Label>Sua API Key</Label>
                <div className="flex mt-1">
                  <Input 
                    value={apiKey} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    className="ml-2"
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast({
                        title: "Copiado!",
                        description: "API Key copiada para o clipboard."
                      });
                    }}
                  >
                    Copiar
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use esta chave para autenticar requisições à API do Telegram
                </p>
              </div>
            )}
          </CardContent>
          {serverStatus === 'connected' && (
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleLogout}
              >
                Desconectar
              </Button>
            </CardFooter>
          )}
        </Card>

        {serverStatus !== 'connected' && (
          <Card>
            <CardHeader>
              <CardTitle>Autenticação Telegram</CardTitle>
              <CardDescription>
                Conecte-se à sua conta do Telegram para acessar a API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {authState === 'initial' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de telefone</Label>
                    <Input
                      id="phone"
                      placeholder="+5511999999999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Digite o número com código do país (ex: +55 para Brasil)
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleSendPhoneNumber}
                    disabled={!phoneNumber || loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar código'}
                  </Button>
                </div>
              )}

              {authState === 'awaitingCode' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Código de verificação</Label>
                    <Input
                      id="code"
                      placeholder="12345"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Digite o código enviado para seu Telegram
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="w-1/2"
                      onClick={() => setAuthState('initial')}
                      disabled={loading}
                    >
                      Voltar
                    </Button>
                    <Button 
                      className="w-1/2" 
                      onClick={handleVerifyCode}
                      disabled={!verificationCode || loading}
                    >
                      {loading ? 'Verificando...' : 'Verificar'}
                    </Button>
                  </div>
                </div>
              )}

              {authState === 'awaitingPassword' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha de dois fatores</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Digite sua senha de dois fatores do Telegram
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="w-1/2"
                      onClick={() => setAuthState('awaitingCode')}
                      disabled={loading}
                    >
                      Voltar
                    </Button>
                    <Button 
                      className="w-1/2" 
                      onClick={handleSubmitPassword}
                      disabled={!password || loading}
                    >
                      {loading ? 'Verificando...' : 'Entrar'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {serverStatus === 'connected' && (
          <Card>
            <CardHeader>
              <CardTitle>Documentação da API</CardTitle>
              <CardDescription>
                Endpoints disponíveis para integração com N8N
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="auth">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="auth">Autenticação</TabsTrigger>
                  <TabsTrigger value="chats">Chats</TabsTrigger>
                  <TabsTrigger value="messages">Mensagens</TabsTrigger>
                  <TabsTrigger value="files">Arquivos</TabsTrigger>
                </TabsList>
                <TabsContent value="auth" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-medium">POST /api/telegram/auth/phone</h3>
                    <p className="text-sm text-gray-600">Envia código de verificação para o número de telefone</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl -X POST https://seu-dominio.com/api/telegram/auth/phone \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"phone": "+5511999999999"}'`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">POST /api/telegram/auth/code</h3>
                    <p className="text-sm text-gray-600">Verifica o código recebido</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl -X POST https://seu-dominio.com/api/telegram/auth/code \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"code": "12345"}'`}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="chats" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-medium">GET /api/chats</h3>
                    <p className="text-sm text-gray-600">Lista todos os chats disponíveis</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl https://seu-dominio.com/api/chats \\
  -H "X-API-Key: ${apiKey}"`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">GET /api/chats/{'{chatId}'}</h3>
                    <p className="text-sm text-gray-600">Obtém detalhes de um chat específico</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl https://seu-dominio.com/api/chats/123456789 \\
  -H "X-API-Key: ${apiKey}"`}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="messages" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-medium">GET /api/chats/{'{chatId}'}/messages</h3>
                    <p className="text-sm text-gray-600">Lista mensagens de um chat</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl https://seu-dominio.com/api/chats/123456789/messages?limit=50 \\
  -H "X-API-Key: ${apiKey}"`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">GET /api/messages/{'{messageId}'}</h3>
                    <p className="text-sm text-gray-600">Obtém detalhes de uma mensagem específica</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl https://seu-dominio.com/api/messages/987654321 \\
  -H "X-API-Key: ${apiKey}"`}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="files" className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-lg font-medium">GET /api/files/{'{fileId}'}/info</h3>
                    <p className="text-sm text-gray-600">Obtém informações sobre um arquivo</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl https://seu-dominio.com/api/files/abcdef123456/info \\
  -H "X-API-Key: ${apiKey}"`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">GET /api/files/{'{fileId}'}/download</h3>
                    <p className="text-sm text-gray-600">Baixa um arquivo</p>
                    <pre className="bg-gray-100 p-3 rounded-md mt-2 text-sm">
                      {`curl -O https://seu-dominio.com/api/files/abcdef123456/download \\
  -H "X-API-Key: ${apiKey}"`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Sobre a API Telegram Conduit</CardTitle>
            <CardDescription>
              Interface entre Telegram e N8N para MVP
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose">
              <p>
                Esta API permite conectar o N8N ao Telegram para recuperar mensagens e arquivos de chats
                privados e grupos. Ideal para MVPs que precisam integrar dados do Telegram em seus workflows.
              </p>
              <h3 className="text-lg font-medium mt-4">Recursos disponíveis:</h3>
              <ul className="list-disc pl-5">
                <li>Autenticação simplificada com o Telegram</li>
                <li>Acesso a mensagens de chats privados e grupos</li>
                <li>Download de arquivos e mídia</li>
                <li>Integração fácil com workflows do N8N</li>
              </ul>
              <p className="mt-4">
                Para usar esta API, primeiro autentique-se com sua conta do Telegram
                e use a API Key gerada para fazer requisições.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
