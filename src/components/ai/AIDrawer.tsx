// Hello Khata OS - AI Copilot Drawer
// Dynamic data with real LLM chat and working actions

'use client';

import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useUiStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { Button, Badge } from '@/components/ui/premium';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sparkles,
  MessageSquare,
  Zap,
  FileText,
  Send,
  ChevronRight,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  ArrowRight,
  Bot,
  User,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PlusCircle,
  ClipboardList,
} from 'lucide-react';

type TabId = 'brief' | 'chat' | 'actions';

// Empty subscribe for useSyncExternalStore
const emptySubscribe = () => () => {};

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Insight {
  id: string;
  type: 'alert' | 'opportunity' | 'achievement' | 'info';
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  actionBn: string;
  actionType?: string;
}

interface QuickStat {
  label: string;
  labelBn: string;
  value: string;
  trend?: string;
  positive?: boolean;
}

interface BriefData {
  insights: Insight[];
  quickStats: QuickStat[];
  summary: {
    todaySales: number;
    todayProfit: number;
    salesGrowth: number;
    lowStockCount: number;
    overdueCount: number;
    pendingPayments: number;
  };
}

// AI Launcher Button - Fixed position, always visible
export function AILauncherButton() {
  const { aiDrawerCollapsed: isCollapsed, toggleAiDrawer: onToggle } = useUiStore();
  const { isBangla } = useAppTranslation();
  const [showTooltip, setShowTooltip] = useState(false);
  const [hover, setHover] = useState(false);

  // Only render on client side
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Only show launcher when drawer is collapsed
  if (!mounted || !isCollapsed) return null;

  // Button content
  const buttonElement = (
    <div
      id="ai-launcher-container"
      style={{
        position: 'fixed',
        right: '18px',
        top: '50%',
        marginTop: '-24px',
        zIndex: 99999,
      }}
      onMouseEnter={() => {
        setShowTooltip(true);
        setHover(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setHover(false);
      }}
    >
      {/* Main Button */}
      <button
        onClick={onToggle}
        aria-label="AI Copilot"
        style={{
          position: 'relative',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4F5BFF, #6366F1)',
          color: 'white',
          border: '1px solid rgba(79, 91, 255, 0.3)',
          boxShadow: hover
            ? '0 0 24px rgba(79, 91, 255, 0.5)'
            : '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'box-shadow 0.2s ease, background 0.2s ease',
        }}
      >
        <Sparkles style={{ width: '20px', height: '20px' }} />

        {/* Pulse ring animation */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '12px',
            background: 'rgba(79, 91, 255, 0.2)',
            animation: 'aiButtonPulse 2s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            right: '100%',
            marginRight: '12px',
            top: '50%',
            marginTop: '-16px',
            whiteSpace: 'nowrap',
            background: 'var(--card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            animation: 'fadeInLeft 0.15s ease-out',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--foreground)' }}>
            {isBangla ? 'AI কোপাইলট' : 'AI Copilot'}
          </span>
        </div>
      )}

      {/* Injected styles for animations */}
      <style>{`
        @keyframes aiButtonPulse {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );

  // Render via portal to body
  return createPortal(buttonElement, document.body);
}

// AI Drawer Component
export function AIDrawer() {
  const { isBangla } = useAppTranslation();
  const { aiDrawerCollapsed: isCollapsed, toggleAiDrawer: onToggle } = useUiStore();
  const { business } = useSessionStore();
  const [activeTab, setActiveTab] = useState<TabId>('brief');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [briefData, setBriefData] = useState<BriefData | null>(null);
  const [isLoadingBrief, setIsLoadingBrief] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch brief data
  const fetchBriefData = useCallback(async () => {
    if (!business?.id) return;

    setIsLoadingBrief(true);
    try {
      const response = await fetch('/api/ai/brief', {
        headers: {
          'x-business-id': business.id,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch brief');

      const result = await response.json();
      if (result.success) {
        setBriefData(result.data);
      }
    } catch (error) {
      console.error('Error fetching brief:', error);
    } finally {
      setIsLoadingBrief(false);
    }
  }, [business?.id]);

  // Fetch brief on mount and when drawer opens
  useEffect(() => {
    if (!isCollapsed && business?.id) {
      fetchBriefData();
    }
  }, [isCollapsed, business?.id, fetchBriefData]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const tabs: Array<{ id: TabId; label: string; labelBn: string; icon: React.ElementType }> = [
    { id: 'brief', label: 'Brief', labelBn: 'সারসংক্ষেপ', icon: FileText },
    { id: 'chat', label: 'Chat', labelBn: 'চ্যাট', icon: MessageSquare },
    { id: 'actions', label: 'Actions', labelBn: 'অ্যাকশন', icon: Zap },
  ];

  // Handle action click - switches to chat and sends a query
  const handleActionClick = (queryEn: string, queryBn: string) => {
    // Switch to chat tab
    setActiveTab('chat');
    
    // Set the query and send it
    const query = isBangla ? queryBn : queryEn;
    setChatInput(query);
    
    // Auto-send after a short delay to let the tab switch
    setTimeout(() => {
      handleSendMessageWithQuery(query);
    }, 100);
  };

  // Send chat message with specific query
  const handleSendMessageWithQuery = async (queryText: string) => {
    if (!queryText.trim() || !business?.id) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business.id,
        },
        body: JSON.stringify({
          query: queryText,
          language: isBangla ? 'bn' : 'en',
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const result = await response.json();

      if (result.success && result.data?.answer) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.answer,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isBangla
          ? 'দুঃখিত, আমি উত্তর দিতে পারছি না। আবার চেষ্টা করুন।'
          : 'Sorry, I could not process your request. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Suggested actions - now trigger chat queries
  const suggestedActions = [
    {
      id: 'new-sale',
      label: 'New Sale',
      labelBn: 'নতুন বিক্রি',
      icon: DollarSign,
      queryEn: 'How do I create a new sale?',
      queryBn: 'কিভাবে নতুন বিক্রি তৈরি করব?',
    },
    {
      id: 'record-payment',
      label: 'Record Payment',
      labelBn: 'পেমেন্ট রেকর্ড',
      icon: DollarSign,
      queryEn: 'How do I record a payment?',
      queryBn: 'কিভাবে পেমেন্ট রেকর্ড করব?',
    },
    {
      id: 'add-expense',
      label: 'Add Expense',
      labelBn: 'খরচ যোগ করুন',
      icon: PlusCircle,
      queryEn: 'How do I add an expense?',
      queryBn: 'কিভাবে খরচ যোগ করব?',
    },
    {
      id: 'check-stock',
      label: 'Check Low Stock',
      labelBn: 'কম স্টক চেক',
      icon: AlertTriangle,
      queryEn: 'Show me low stock items',
      queryBn: 'কম স্টক পণ্য দেখাও',
    },
    {
      id: 'collect-overdue',
      label: 'Collect Overdue',
      labelBn: 'বকেয়া আদায়',
      icon: Users,
      queryEn: 'Show me overdue payments to collect',
      queryBn: 'বকেয়া পেমেন্ট দেখাও',
    },
    {
      id: 'new-quotation',
      label: 'New Quotation',
      labelBn: 'নতুন কোটেশন',
      icon: ClipboardList,
      queryEn: 'How do I create a quotation?',
      queryBn: 'কিভাবে কোটেশন তৈরি করব?',
    },
  ];

  // Handle insight action click - switches to chat and shows info
  const handleInsightAction = (insight: Insight) => {
    if (insight.actionType) {
      // Map action types to queries
      const actionQueries: Record<string, { en: string; bn: string }> = {
        'view-credit': { en: 'Show me credit risk analysis', bn: 'ক্রেডিট ঝুঁকি বিশ্লেষণ দেখাও' },
        'collect-overdue': { en: 'Show me overdue payments', bn: 'বকেয়া পেমেন্ট দেখাও' },
        'view-low-stock': { en: 'Show me low stock items', bn: 'কম স্টক পণ্য দেখাও' },
        'view-dead-stock': { en: 'Show me dead stock items', bn: 'অচল স্টক পণ্য দেখাও' },
        'view-report': { en: 'Show me sales report', bn: 'বিক্রি রিপোর্ট দেখাও' },
        'view-top-items': { en: 'Show me top selling items', bn: 'সর্বাধিক বিক্রিত পণ্য দেখাও' },
      };
      
      const query = actionQueries[insight.actionType];
      if (query) {
        handleActionClick(query.en, query.bn);
      }
    }
  };

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !business?.id) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-business-id': business.id,
        },
        body: JSON.stringify({
          query: chatInput,
          language: isBangla ? 'bn' : 'en',
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const result = await response.json();

      if (result.success && result.data?.answer) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.data.answer,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isBangla
          ? 'দুঃখিত, আমি উত্তর দিতে পারছি না। আবার চেষ্টা করুন।'
          : 'Sorry, I could not process your request. Please try again.',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 bottom-0 z-40',
        'bg-card border-l border-border-subtle',
        'flex flex-col',
        'transition-all duration-250 ease-out',
        !isCollapsed && 'pointer-events-auto'
      )}
      style={{
        width: isCollapsed ? 0 : '400px',
        opacity: isCollapsed ? 0 : 1,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-emerald/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">AI Copilot</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'brief' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={fetchBriefData}
              disabled={isLoadingBrief}
            >
              <RefreshCw className={cn('h-4 w-4', isLoadingBrief && 'animate-spin')} />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={onToggle}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary bg-primary-subtle/30'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {isBangla ? tab.labelBn : tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'brief' && (
          <ScrollArea className="h-full p-4">
            {/* Date Header */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {new Date().toLocaleDateString(isBangla ? 'bn-BD' : 'en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              <h3 className="text-lg font-semibold mt-1">
                {isBangla ? 'আজকের সারসংক্ষেপ' : "Today's Brief"}
              </h3>
            </div>

            {/* Loading State */}
            {isLoadingBrief && !briefData && (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {isBangla ? 'লোড হচ্ছে...' : 'Loading...'}
                  </p>
                </div>
              </div>
            )}

            {/* Brief Items */}
            {briefData && briefData.insights.length > 0 && (
              <div className="space-y-3">
                {briefData.insights.map((item, index) => (
                  <BriefCard
                    key={item.id}
                    item={item}
                    isBangla={isBangla}
                    index={index}
                    onAction={() => handleInsightAction(item)}
                  />
                ))}
              </div>
            )}

            {/* No insights */}
            {briefData && briefData.insights.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-primary-subtle flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {isBangla ? 'সব ঠিক আছে!' : 'All Good!'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isBangla
                    ? 'কোনো সতর্কতা বা সুযোগ নেই'
                    : 'No alerts or opportunities right now'}
                </p>
              </div>
            )}

            {/* Quick Stats */}
            {briefData && (
              <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border-subtle">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {isBangla ? 'দ্রুত পরিসংখ্যান' : 'Quick Stats'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {briefData.quickStats.map((stat, i) => (
                    <QuickStat key={i} stat={stat} isBangla={isBangla} />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald/20 flex items-center justify-center mb-4">
                    <Bot className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {isBangla ? 'AI সহায়কে জিজ্ঞাসা করুন' : 'Ask AI Copilot'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isBangla
                      ? 'আপনার ব্যবসা সম্পর্কে যেকোনো প্রশ্ন করুন'
                      : 'Ask anything about your business'}
                  </p>

                  {/* Suggested Queries */}
                  <div className="mt-6 space-y-2 w-full">
                    {[
                      isBangla ? 'আমার মুনাফা কেমন?' : "What's my profit?",
                      isBangla ? 'কোন পণ্য বেশি বিক্রি হচ্ছে?' : 'Top selling items?',
                      isBangla ? 'বকেয়া কত?' : 'How much is receivable?',
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(q)}
                        className="w-full text-left text-xs p-2.5 rounded-lg bg-muted/50 hover:bg-muted border border-border-subtle transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <ChatBubble key={msg.id} message={msg} isBangla={isBangla} />
                  ))}
                  {isTyping && (
                    <div className="flex gap-2">
                      <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center">
                        <Bot className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="bg-muted rounded-xl px-3 py-2">
                        <div className="flex gap-1">
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <div
                            className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Chat Input */}
            <div className="p-4 border-t border-border-subtle shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder={isBangla ? 'প্রশ্ন লিখুন...' : 'Type a question...'}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim() || isTyping}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'actions' && (
          <ScrollArea className="h-full p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {isBangla ? 'দ্রুত অ্যাকশন' : 'Quick Actions'}
            </p>

            <div className="space-y-2">
              {suggestedActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.queryEn, action.queryBn)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted border border-border-subtle transition-colors text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary-subtle flex items-center justify-center">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium flex-1">
                    {isBangla ? action.labelBn : action.label}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Playbooks Section */}
            {briefData && (briefData.summary.overdueCount > 0 || briefData.summary.lowStockCount > 0) && (
              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {isBangla ? 'প্লেবুক' : 'Playbooks'}
                </p>
                <div className="space-y-2">
                  {briefData.summary.overdueCount > 0 && (
                    <PlaybookCard
                      title="Collect Overdue"
                      titleBn="বকেয়া আদায়"
                      description={`${briefData.summary.overdueCount} customers with overdue payments`}
                      descriptionBn={`${briefData.summary.overdueCount} জন গ্রাহকের বকেয়া আছে`}
                      impact="High Priority"
                      isBangla={isBangla}
                      onClick={() => handleActionClick('Show me overdue payments', 'বকেয়া পেমেন্ট দেখাও')}
                    />
                  )}
                  {briefData.summary.lowStockCount > 0 && (
                    <PlaybookCard
                      title="Restock Items"
                      titleBn="পণ্য রিস্টক"
                      description={`${briefData.summary.lowStockCount} items below minimum stock`}
                      descriptionBn={`${briefData.summary.lowStockCount}টি পণ্য ন্যূনতমের নিচে`}
                      impact="Action Needed"
                      isBangla={isBangla}
                      onClick={() => handleActionClick('Show me low stock items', 'কম স্টক পণ্য দেখাও')}
                    />
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </aside>
  );
}

// Brief Card Component
function BriefCard({
  item,
  isBangla,
  index,
  onAction,
}: {
  item: Insight;
  isBangla: boolean;
  index: number;
  onAction: () => void;
}) {
  const typeStyles = {
    alert: 'border-l-destructive bg-destructive-subtle/30',
    opportunity: 'border-l-primary bg-primary-subtle/30',
    achievement: 'border-l-emerald bg-emerald-subtle/30',
    info: 'border-l-indigo bg-indigo-subtle/30',
  };

  const impactStyles = {
    high: 'bg-destructive-subtle text-destructive',
    medium: 'bg-warning-subtle text-warning',
    low: 'bg-primary-subtle text-primary',
  };

  return (
    <div
      className={cn('p-3 rounded-xl border-l-2', typeStyles[item.type])}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground">
          {isBangla ? item.titleBn : item.title}
        </p>
        <Badge className={cn('text-[10px]', impactStyles[item.impact])}>
          {item.impact.toUpperCase()}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {isBangla ? item.descriptionBn : item.description}
      </p>
      <button
        onClick={onAction}
        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
      >
        {isBangla ? item.actionBn : item.action}
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// Quick Stat Component
function QuickStat({ stat, isBangla }: { stat: QuickStat; isBangla: boolean }) {
  return (
    <div className="p-2 rounded-lg bg-background/50">
      <p className="text-[10px] text-muted-foreground">{isBangla ? stat.labelBn : stat.label}</p>
      <p className="text-sm font-bold text-foreground">{stat.value}</p>
      {stat.trend && (
        <p
          className={cn(
            'text-[10px] font-medium flex items-center gap-0.5',
            stat.positive ? 'text-primary' : 'text-destructive'
          )}
        >
          {stat.positive ? (
            <TrendingUp className="h-2.5 w-2.5" />
          ) : (
            <TrendingDown className="h-2.5 w-2.5" />
          )}
          {stat.trend}
        </p>
      )}
    </div>
  );
}

// Chat Bubble Component
function ChatBubble({ message, isBangla }: { message: ChatMessage; isBangla: boolean }) {
  return (
    <div className={cn('flex gap-2', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0',
          message.role === 'user' ? 'bg-primary-subtle' : 'bg-muted'
        )}
      >
        {message.role === 'user' ? (
          <User className="h-3 w-3 text-primary" />
        ) : (
          <Bot className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap',
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  );
}

// Playbook Card Component
function PlaybookCard({
  title,
  titleBn,
  description,
  descriptionBn,
  impact,
  isBangla,
  onClick,
}: {
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  impact: string;
  isBangla: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-xl bg-muted/30 border border-border-subtle text-left hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-foreground">
          {isBangla ? titleBn : title}
        </p>
        <span className="text-xs font-bold text-primary">{impact}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {isBangla ? descriptionBn : description}
      </p>
    </button>
  );
}

export default AIDrawer;
