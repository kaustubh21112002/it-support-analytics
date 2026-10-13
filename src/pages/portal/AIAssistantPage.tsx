import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BookOpen,
  PlusCircle,
  Ticket as TicketIcon,
  ShieldAlert
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedActions?: Array<{
    label: string;
    actionType: 'create_ticket' | 'view_kb' | 'view_tickets';
    payload?: any;
  }>;
}

export const AIAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: `Hello! I'm your **AI Support Assistant**.\n\nI can help you troubleshoot network connectivity, reset MFA tokens, check your existing support tickets, or guide you through creating a new service ticket.\n\nWhat would you like assistance with today?`,
      timestamp: 'Just now',
      suggestedActions: [
        { label: 'Troubleshoot VPN Issue', actionType: 'view_kb', payload: 'kb-102' },
        { label: 'Check My Open Tickets', actionType: 'view_tickets' },
        { label: 'Create a Support Ticket', actionType: 'create_ticket' }
      ]
    }
  ]);

  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: query,
      timestamp: 'Just now'
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate smart agent processing
    setTimeout(() => {
      const response = dataService.chatWithAiAssistant(query, []);
      const botMsg: Message = {
        id: `msg-${Date.now()}-bot`,
        sender: 'assistant',
        text: response.reply,
        timestamp: 'Just now',
        suggestedActions: response.suggestedActions
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  const handleActionClick = (action: { label: string; actionType: string; payload?: any }) => {
    if (action.actionType === 'create_ticket') {
      navigate('/portal/tickets/new');
    } else if (action.actionType === 'view_kb') {
      navigate(`/portal/knowledge?article=${action.payload || ''}`);
    } else if (action.actionType === 'view_tickets') {
      navigate('/portal/tickets');
    }
  };

  const promptChips = [
    'Help me troubleshoot a connectivity issue.',
    'Show my open tickets.',
    'Help me create a ticket.',
    'Find an article about access problems.'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <PageHeader
        title="AI Support Assistant"
        subtitle="Simulated diagnostic assistant for instant triage, runbook recommendations, and ticket escalation."
        breadcrumbs={[
          { label: 'Portal', path: '/portal' },
          { label: 'AI Assistant' }
        ]}
      />

      {/* Transparency disclosure banner */}
      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs flex items-start gap-2.5 text-indigo-900">
        <Sparkles className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold">Prototype AI Boundary: </span>
          <span>
            This conversational assistant demonstrates deterministic intent recognition and automated runbook retrieval based on seeded enterprise IT knowledge. It does not execute unverified commands or modify production account privileges directly.
          </span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested:</span>
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="text-xs bg-surface border border-border hover:border-brand-300 hover:bg-brand-50/50 text-text-primary px-3 py-1.5 rounded-full transition-all shadow-sm"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="bg-surface rounded-xl border border-border shadow-card flex flex-col h-[560px] overflow-hidden">
        {/* Messages feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-2xl ${
                m.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-brand-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl text-xs space-y-2 shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-surface border border-border text-text-primary rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed font-sans">
                  {m.text}
                </div>

                {m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="pt-2 border-t border-border flex flex-wrap gap-2">
                    {m.suggestedActions.map((act, i) => (
                      <button
                        key={i}
                        onClick={() => handleActionClick(act)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold rounded-lg text-xs transition-colors"
                      >
                        {act.actionType === 'create_ticket' && <PlusCircle className="w-3 h-3" />}
                        {act.actionType === 'view_kb' && <BookOpen className="w-3 h-3" />}
                        {act.actionType === 'view_tickets' && <TicketIcon className="w-3 h-3" />}
                        <span>{act.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className={`text-[10px] block text-right mt-1 ${
                  m.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'
                }`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <div className="p-3 bg-surface border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or describe your issue (e.g. VPN error, password reset)..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
