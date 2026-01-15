import { useState } from "react";
import { MessageCircle, ExternalLink, Settings } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function WhatsApp() {
  const [customUrl, setCustomUrl] = useState('https://web.whatsapp.com');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <AdminLayout title="WhatsApp">
      <div className="space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">WhatsApp Web</CardTitle>
                  <CardDescription>
                    Acesse o WhatsApp Web ou seu CRM de mensagens
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(customUrl, '_blank')}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em nova aba
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {showSettings && (
            <CardContent className="pt-0 pb-4">
              <div className="flex gap-2">
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="URL do WhatsApp Web ou CRM"
                  className="flex-1"
                />
                <Button onClick={() => setShowSettings(false)}>Salvar</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Você pode usar a URL do WaSeller ou outro CRM de WhatsApp aqui.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Iframe Container */}
        <div className="relative w-full rounded-xl overflow-hidden border bg-background" style={{ height: 'calc(100vh - 280px)' }}>
          <iframe
            src={customUrl}
            className="w-full h-full"
            title="WhatsApp Web"
            allow="camera; microphone; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
          
          {/* Overlay for blocked iframes */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">WhatsApp Web</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              Alguns navegadores bloqueiam iframes por segurança. 
              Se o conteúdo não carregar, use o botão "Abrir em nova aba".
            </p>
            <Button
              onClick={() => window.open(customUrl, '_blank')}
              className="gap-2 pointer-events-auto"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir WhatsApp Web
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.open('https://web.whatsapp.com', '_blank')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-medium">WhatsApp Web</div>
                <div className="text-xs text-muted-foreground">Versão oficial</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => window.open('https://business.facebook.com', '_blank')}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium">Meta Business</div>
                <div className="text-xs text-muted-foreground">WhatsApp Business API</div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
            setCustomUrl('https://waseller.com.br');
            setShowSettings(true);
          }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium">WaSeller</div>
                <div className="text-xs text-muted-foreground">CRM de WhatsApp</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
