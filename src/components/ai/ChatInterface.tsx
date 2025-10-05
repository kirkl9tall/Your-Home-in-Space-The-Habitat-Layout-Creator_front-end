import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Sparkles,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

interface ChatInterfaceProps {
  designContext: any; // Will receive data from generateNASALayoutFromStorage()
  onSuggestionApply?: (suggestion: any) => void;
  className?: string;
}

export function ChatInterface({ designContext, onSuggestionApply, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your NASA Habitat Design Assistant. I can help you:\n\n• Analyze your current design against NASA standards\n• Suggest optimal module placement\n• Explain compliance issues\n• Provide mission-specific guidance\n\nWhat would you like to know about your habitat design?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(messageId);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const loadingMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Prepare the API request payload
      const apiPayload = {
        message: inputMessage.trim(),
        state: designContext
      };

      // Debug: Log the API key being used
      const apiKey = import.meta.env.VITE_NASA_API_KEY || 'your_api_key_here';
      console.log('🔑 API Key being used:', apiKey);
      console.log('📤 API Payload:', apiPayload);

      // Make the API call to your Modal endpoint
      const response = await fetch('https://amine759--nasa-habitat-validator-api.modal.run/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Use import.meta.env for Vite environment variables
          'X-API-Key': apiKey
        },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: data.response || 'I received your message, but got an empty response. Please try again.',
        timestamp: new Date()
      };

      // Replace the loading message with the actual response
      setMessages(prev => prev.slice(0, -1).concat(assistantMessage));
      
    } catch (err: any) {
      console.error('Chat API error:', err);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error: ${err.message}\n\nPlease check your connection and try again. If the problem persists, the API might be temporarily unavailable.`,
        timestamp: new Date()
      };

      setMessages(prev => prev.slice(0, -1).concat(errorMessage));
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Chat cleared! I'm ready to help with your habitat design. What would you like to analyze or discuss?",
      timestamp: new Date()
    }]);
    setError(null);
  };

  const quickActions = [
    {
      label: "Analyze Current Design",
      message: "Please analyze my current habitat design against NASA standards and regulations."
    },
    {
      label: "Check Fairing Fit",
      message: "Does my habitat fit within the selected launch vehicle fairing?"
    },
    {
      label: "Volume Requirements", 
      message: "Is my habitat volume sufficient for the mission duration and crew size?"
    },
    {
      label: "Module Suggestions",
      message: "What modules should I add to improve my habitat design?"
    }
  ];

  const getMessageIcon = (type: string, loading?: boolean) => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (type === 'user') return <User className="w-4 h-4" />;
    return <Bot className="w-4 h-4" />;
  };

  const getStatusBadge = () => {
    if (isLoading) return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analyzing</Badge>;
    if (error) return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Error</Badge>;
    return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Ready</Badge>;
  };

  return (
    <Card className={`flex flex-col h-full overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            NASA Design Assistant
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button
              size="sm"
              variant="ghost"
              onClick={clearChat}
              className="h-6 w-6 p-0"
              title="Clear chat"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
        
        {/* Design Context Summary */}
        {designContext && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            <div className="flex items-center gap-4">
              <span>Crew: {designContext.scenario?.crew_size || 'N/A'}</span>
              <span>Duration: {designContext.scenario?.mission_duration_days || 'N/A'} days</span>
              <span>Destination: {designContext.scenario?.destination || 'N/A'}</span>
              <span>Modules: {designContext.modules?.length || 0}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 min-h-0" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {getMessageIcon(message.type, message.loading)}
                </div>
                
                <div className={`flex-1 max-w-[85%] ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-lg text-sm ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {message.loading ? (
                      <div className="flex items-center gap-2">
                        <span>Analyzing your design...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                    message.type === 'user' ? 'justify-end' : ''
                  }`}>
                    <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.type === 'assistant' && !message.loading && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        {copied === message.id ? 
                          <Check className="w-3 h-3" /> : 
                          <Copy className="w-3 h-3" />
                        }
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 py-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">Quick actions:</div>
            <div className="grid grid-cols-2 gap-1">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="ghost"
                  className="text-xs h-auto py-2 px-2 text-left justify-start whitespace-normal"
                  onClick={() => setInputMessage(action.message)}
                  disabled={isLoading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your habitat design..."
              disabled={isLoading}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {error && (
            <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Connection error. Please try again.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}