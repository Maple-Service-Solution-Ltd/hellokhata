// Hello Khata OS - Premium AI Assistant Page
// Enterprise-grade chat interface with proper layout

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, Badge, Button, Divider } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  AlertTriangle,
  Lightbulb,
  Trophy,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ArrowUpRight,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { useAiInsights, useDashboardStats } from '@/hooks/queries';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useFeatureAccess } from '@/stores/featureGateStore';
import { useSessionStore } from '@/stores/sessionStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tables?: Array<{
    headers: string[];
    rows: string[][];
  }>;
}

export default function AIPage() {
  const { t, isBangla } = useAppTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: insights } = useAiInsights();
  const { data: dashboardStats } = useDashboardStats();
  const featureAccess = useFeatureAccess('aiAssistant');

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message
  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call real AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': useSessionStore.getState().business?.id || '',
        },
        body: JSON.stringify({
          query: textToSend,
          language: isBangla ? 'bn' : 'en',
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const aiResponse = data.data;
        
        // Build response content
        let content = aiResponse.answer;
        
        // Add insights
        if (aiResponse.insights && aiResponse.insights.length > 0) {
          content += '\n\n' + (isBangla ? '💡 অন্তর্দৃষ্টি:' : '💡 Insights:');
          aiResponse.insights.forEach((insight: string) => {
            content += '\n• ' + insight;
          });
        }
        
        // Add risks
        if (aiResponse.risks && aiResponse.risks.length > 0) {
          content += '\n\n' + (isBangla ? '⚠️ ঝুঁকি:' : '⚠️ Risks:');
          aiResponse.risks.forEach((risk: string) => {
            content += '\n• ' + risk;
          });
        }
        
        // Add recommendations
        if (aiResponse.recommendations && aiResponse.recommendations.length > 0) {
          content += '\n\n' + (isBangla ? '📌 সুপারিশ:' : '📌 Recommendations:');
          aiResponse.recommendations.forEach((rec: string) => {
            content += '\n• ' + rec;
          });
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content,
          timestamp: new Date(),
          tables: aiResponse.tables,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Handle error
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: isBangla 
            ? 'দুঃখিত, আমি এই মুহূর্তে আপনার প্রশ্নের উত্তর দিতে পারছি না। অনুগ্রহ করে আবার চেষ্টা করুন।'
            : 'Sorry, I cannot answer your question at this moment. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      // Handle network error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isBangla 
          ? 'নেটওয়ার্ক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Network error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Copy message to clipboard
  const copyToClipboard = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle voice recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // Quick action suggestions - these trigger AI queries
  const quickActions = [
    { icon: TrendingUp, label: isBangla ? 'বিক্রি বিশ্লেষণ' : 'Sales Analysis', color: 'primary', action: 'query' },
    { icon: Package, label: isBangla ? 'স্টক রিপোর্ট' : 'Stock Report', color: 'emerald', action: 'query' },
    { icon: Users, label: isBangla ? 'পার্টি সারসংক্ষেপ' : 'Party Summary', color: 'warning', action: 'query' },
    { icon: DollarSign, label: isBangla ? 'লাভের হিসাব' : 'Profit Calculation', color: 'default', action: 'query' },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
        <div className="flex flex-col min-h-[calc(100vh-8rem)]">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pt-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {isBangla ? 'AI সহায়ক' : 'AI Assistant'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isBangla ? 'আপনার ব্যবসার স্মার্ট সহায়ক' : 'Your smart business assistant'}
              </p>
            </div>
            <Badge variant="indigo" size="lg">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              AI Powered
            </Badge>
          </div>

          {/* Main Content Grid */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 min-h-0">
            
            {/* Chat Area - Takes remaining space */}
            <Card variant="elevated" padding="none" className="flex flex-col overflow-hidden">
              {/* Messages */}
              <ScrollArea className="flex-1 p-6" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    {/* AI Icon */}
                    <div className="relative mb-6">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                        <Bot className="h-10 w-10 text-primary" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      </div>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {isBangla ? 'AI সহায়কে প্রশ্ন করুন' : 'Ask the AI Assistant'}
                    </h2>
                    <p className="text-sm text-muted-foreground  mb-8">
                      {isBangla
                        ? 'আপনার ব্যবসার যেকোনো প্রশ্ন করুন - বিক্রি, স্টক, পার্টি বা লাভের হিসাব সম্পর্কে'
                        : 'Ask anything about your business - sales, stock, parties, or profit calculations'}
                    </p>

                    {/* Quick Actions - Full width flex container */}
                    <div className="flex flex-wrap justify-center gap-3 w-full">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(action.label)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                            'border border-border/50 min-w-[140px] whitespace-nowrap',
                            'hover:scale-[1.02] active:scale-[0.98]',
                            action.color === 'primary' && 'bg-primary/10 text-primary hover:bg-primary/20',
                            action.color === 'emerald' && 'bg-emerald/10 text-emerald hover:bg-emerald/20',
                            action.color === 'warning' && 'bg-warning/10 text-warning hover:bg-warning/20',
                            action.color === 'default' && 'bg-muted text-foreground hover:bg-muted/80'
                          )}
                        >
                          <action.icon className="h-4 w-4 flex-shrink-0" />
                          <span className="whitespace-nowrap">{action.label}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-50 ml-auto flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-w-3xl mx-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-3',
                          message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0',
                          message.role === 'user'
                            ? 'bg-primary/20'
                            : 'bg-gradient-to-br from-primary/20 to-primary/10'
                        )}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 text-primary" />
                          ) : (
                            <Bot className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        
                        {/* Message Bubble */}
                        <div className={cn(
                          'max-w-[75%] group',
                          message.role === 'user' ? 'text-right' : 'text-left'
                        )}>
                          <div className={cn(
                            'rounded-xl px-4 py-3',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Data Table */}
                            {message.tables && message.tables.map((table, i) => (
                              <div key={i} className="mt-3 overflow-hidden rounded-lg border border-border/50">
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/50">
                                    <tr>
                                      {table.headers.map((header, j) => (
                                        <th key={j} className="px-3 py-2 text-left font-medium text-muted-foreground">
                                          {header}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {table.rows.map((row, j) => (
                                      <tr key={j} className="border-t border-border/50">
                                        {row.map((cell, k) => (
                                          <td key={k} className="px-3 py-2">{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                          </div>
                          
                          {/* Message Actions */}
                          <div className={cn(
                            'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          )}>
                            <span className="text-[10px] text-muted-foreground">
                              {message.timestamp.toLocaleTimeString(isBangla ? 'bn-BD' : 'en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {message.role === 'assistant' && (
                              <button
                                onClick={() => copyToClipboard(message.id, message.content)}
                                className="h-5 w-5 rounded hover:bg-muted flex items-center justify-center"
                              >
                                {copiedId === message.id ? (
                                  <Check className="h-3 w-3 text-primary" />
                                ) : (
                                  <Copy className="h-3 w-3 text-muted-foreground" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-xl px-4 py-3">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-border/50">
                <div className="flex gap-3 items-center max-w-3xl mx-auto">
                  <Button
                    variant={isRecording ? 'destructive' : 'ghost'}
                    size="icon"
                    onClick={toggleRecording}
                    className="flex-shrink-0"
                  >
                    {isRecording ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Input
                    ref={inputRef}
                    placeholder={isBangla ? 'আপনার প্রশ্ন লিখুন...' : 'Type your question...'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    className="h-11 flex-1"
                  />
                  <Button 
                    onClick={() => handleSend()} 
                    size="icon"
                    className="h-11 w-11 flex-shrink-0"
                    disabled={!input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Insights Panel - Fixed width sidebar */}
            <Card variant="elevated" padding="none" className="hidden lg:flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border/50">
                <h3 className="font-medium flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-warning" />
                  {isBangla ? 'ইনসাইটস' : 'Insights'}
                </h3>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {/* Low Stock Alert */}
                  {dashboardStats && dashboardStats.lowStockItems > 0 && (
                    <InsightCard
                      type="alert"
                      title={isBangla ? 'স্টক কম' : 'Low Stock'}
                      description={isBangla 
                        ? `${dashboardStats.lowStockItems}টি পণ্যের স্টক কম`
                        : `${dashboardStats.lowStockItems} items running low`
                      }
                      icon={AlertTriangle}
                    />
                  )}
                  
                  {/* Receivable Alert */}
                  {dashboardStats && dashboardStats.receivable > 0 && (
                    <InsightCard
                      type="suggestion"
                      title={isBangla ? 'পাওনা' : 'Receivables'}
                      description={isBangla 
                        ? `৳${dashboardStats.receivable.toLocaleString()} আদায় করুন`
                        : `৳${dashboardStats.receivable.toLocaleString()} to collect`
                      }
                      icon={DollarSign}
                    />
                  )}
                  
                  {/* Today's Performance */}
                  {dashboardStats && dashboardStats.todaySales > 0 && (
                    <InsightCard
                      type="achievement"
                      title={isBangla ? 'আজকের বিক্রি' : "Today's Sales"}
                      description={isBangla 
                        ? `৳${dashboardStats.todaySales.toLocaleString()} বিক্রি হয়েছে`
                        : `৳${dashboardStats.todaySales.toLocaleString()} in sales`
                      }
                      icon={Trophy}
                    />
                  )}
                  
                  {/* Stock Value */}
                  {dashboardStats && dashboardStats.stockValue > 0 && (
                    <InsightCard
                      type="trend"
                      title={isBangla ? 'স্টক মূল্য' : 'Stock Value'}
                      description={isBangla 
                        ? `৳${dashboardStats.stockValue.toLocaleString()} মজুদ আছে`
                        : `৳${dashboardStats.stockValue.toLocaleString()} in inventory`
                      }
                      icon={Package}
                    />
                  )}

                  {/* Suggestions from AI */}
                  {insights?.suggestions?.slice(0, 2).map((suggestion, idx) => (
                    <InsightCard
                      key={idx}
                      type={suggestion.priority === 'high' ? 'alert' : 'suggestion'}
                      title={isBangla ? suggestion.titleBn || suggestion.title : suggestion.title}
                      description={isBangla ? suggestion.descriptionBn || suggestion.description : suggestion.description}
                      icon={suggestion.priority === 'high' ? AlertTriangle : Lightbulb}
                    />
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>
  );
}

// Insight Card Component
function InsightCard({
  type,
  title,
  description,
  icon: Icon,
}: {
  type: 'alert' | 'suggestion' | 'achievement' | 'trend';
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  const styles = {
    alert: 'border-l-destructive bg-destructive/10',
    suggestion: 'border-l-primary bg-primary/10',
    achievement: 'border-l-emerald bg-emerald/10',
    trend: 'border-l-warning bg-warning/10',
  };
  
  const iconColors = {
    alert: 'text-destructive',
    suggestion: 'text-primary',
    achievement: 'text-emerald',
    trend: 'text-warning',
  };
  
  return (
    <div className={cn('p-3 rounded-lg border-l-2 w-full', styles[type])}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColors[type])} />
        <div className="flex-1 min-w-0 w-full">
          <p className="text-xs font-medium text-foreground whitespace-nowrap">{title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 break-words">{description}</p>
        </div>
      </div>
    </div>
  );
}
