import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Badge } from '@/shared/ui/badge';
import { aiApi } from '../api/ai';
import type { ChatMessage } from '../types';
import { useTranslation } from 'react-i18next';

export const AIPolicyAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n?.language ?? 'en';
  const isRtl = currentLanguage === 'ar';
  const welcomeMessage = t(
    'ai_assistant_welcome',
    "Hello! I'm your HR AI Assistant. I can help you with questions about company policies, leave balances, or attendance rules. How can I help you today?",
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === 'welcome' ? { ...message, content: welcomeMessage } : message,
      ),
    );
  }, [welcomeMessage]);

  const handleSend = async (promptOverride?: string) => {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.query({ prompt, includeContext: true });
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        metadata: response.metadata,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Query failed', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t(
          'ai_assistant_error',
          "I'm sorry, I encountered an error while processing your request. Please try again later.",
        ),
        timestamp: new Date(),
        metadata: { error: true },
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex h-[600px] flex-col overflow-hidden border-primary/20 bg-gradient-to-b from-background via-background to-primary/5 shadow-xl">
      <div className={`absolute top-0 ${isRtl ? 'left-0' : 'right-0'} p-4 opacity-5 pointer-events-none`}>
        <Bot className="w-40 h-40" />
      </div>

      <CardHeader className="border-b bg-background/80 backdrop-blur-sm z-10 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-foreground">{t('ai_policy_assistant', 'HR Policy Assistant')}</p>
              <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">
                {t('ai_powered_by')}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                {t('ai_online_ready', 'Online & Ready')}
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 bg-muted/5">
        <ScrollArea className="h-full px-4 py-6" ref={scrollRef}>
          <div className="space-y-6 max-w-2xl mx-auto" data-testid="chat-messages">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                  msg.role === 'user'
                    ? isRtl
                      ? 'flex-row'
                      : 'flex-row-reverse'
                    : isRtl
                      ? 'flex-row-reverse'
                      : 'flex-row'
                }`}
                data-testid={`chat-message-${msg.role}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground border border-border'
                  }`}
                >
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div
                  className={`group relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all hover:shadow-md ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : msg.metadata?.error
                        ? 'bg-destructive/5 text-destructive border border-destructive/20 rounded-tl-none'
                        : 'bg-background text-foreground border border-border/50 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                  <p className={`text-[10px] mt-1.5 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Intl.DateTimeFormat(currentLanguage, { hour: '2-digit', minute: '2-digit' }).format(msg.timestamp)}
                  </p>
                  {msg.metadata?.error && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`absolute -bottom-10 text-xs gap-1 hover:bg-transparent hover:text-primary p-0 h-auto ${
                        isRtl ? 'right-0' : 'left-0'
                      }`}
                      onClick={() => {
                        const lastUserMsg = [...messages].reverse().find((message) => message.role === 'user');
                        if (lastUserMsg) {
                          void handleSend(lastUserMsg.content);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {t('retry', 'Retry')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`flex gap-3 animate-pulse ${isRtl ? 'flex-row-reverse' : 'flex-row'}`} data-testid="chat-loading">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-background border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm rounded-tl-none">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
                    {t('ai_thinking', 'AI is thinking...')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t bg-background/80 backdrop-blur-sm z-10">
        <div className="w-full max-w-2xl mx-auto space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>{t('ai_powered_by')}</span>
          </div>
          <form
            className="flex w-full items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            data-testid="chat-form"
          >
            <div className="relative flex-1">
              <Input
                placeholder={t('ai_input_placeholder', 'Ask about leaves, policies...')}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className={`h-12 rounded-2xl bg-muted/30 border-primary/10 text-sm transition-all focus-visible:border-primary/30 focus-visible:ring-primary/20 ${
                  isRtl ? 'pl-12' : 'pr-12'
                }`}
                data-testid="chat-input"
              />
              <div className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'}`}>
                <Sparkles className={`w-4 h-4 text-primary/40 ${isLoading ? 'animate-pulse' : ''}`} />
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 shrink-0 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
              data-testid="chat-submit"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
};
