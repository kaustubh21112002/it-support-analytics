import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { KnowledgeArticle } from '../../types';
import {
  BookOpen,
  Search,
  ThumbsUp,
  ThumbsDown,
  Tag,
  ArrowRight,
  PlusCircle,
  CheckCircle2,
  X
} from 'lucide-react';

export const KnowledgeBasePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeArticleId = searchParams.get('article');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [votedArticles, setVotedArticles] = useState<Record<string, 'up' | 'down'>>({});

  const articles = dataService.getKnowledgeArticles(search, selectedCategory);
  const categories = ['All', 'Access & Permissions', 'Network & Connectivity', 'Software', 'Email & Collaboration', 'Cloud & Infrastructure'];

  const selectedArticle = activeArticleId
    ? dataService.getKnowledgeArticles().find((a) => a.id === activeArticleId)
    : null;

  const handleVote = (id: string, isHelpful: boolean) => {
    if (votedArticles[id]) return;
    dataService.voteKnowledgeArticle(id, isHelpful);
    setVotedArticles({ ...votedArticles, [id]: isHelpful ? 'up' : 'down' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Knowledge Base & Runbooks"
        subtitle="Search verified self-service runbooks, system troubleshooting guides, and IT guidelines."
        breadcrumbs={[
          { label: 'Portal', path: '/portal' },
          { label: 'Knowledge Base' }
        ]}
        actions={
          <Link
            to="/portal/tickets/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Still Need Help? Open Ticket</span>
          </Link>
        }
      />

      {/* Search Header */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-card space-y-4">
        <div className="relative max-w-xl mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search runbooks by keyword, system, or error code (e.g. VPN, Outlook, MFA)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-text-primary"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm font-semibold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map((art) => (
          <div
            key={art.id}
            onClick={() => setSearchParams({ article: art.id })}
            className="bg-surface rounded-xl border border-border hover:border-brand-300 shadow-card hover:shadow-card-hover p-5 flex flex-col justify-between cursor-pointer transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider bg-brand-50 px-2 py-0.5 rounded">
                  {art.category}
                </span>
                <span className="text-[10px] text-slate-400">Updated {art.updatedAt}</span>
              </div>

              <h3 className="font-bold text-sm text-text-primary group-hover:text-brand-600 transition-colors mb-2">
                {art.title}
              </h3>

              <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                {art.summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ThumbsUp className="w-3 h-3 text-emerald-500" />
                <span>{art.helpfulCount} helpful</span>
              </div>
              <span className="text-xs font-semibold text-brand-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                Read article <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-border shadow-modal p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  {selectedArticle.category}
                </span>
                <h2 className="text-xl font-bold text-text-primary mt-1">
                  {selectedArticle.title}
                </h2>
                <span className="text-xs text-slate-400 mt-1 block">
                  Last verified: {selectedArticle.updatedAt}
                </span>
              </div>
              <button
                onClick={() => setSearchParams({})}
                className="p-1 rounded-lg text-slate-400 hover:text-text-primary hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-xs text-text-primary leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
              {selectedArticle.content}
            </div>

            {/* Helpfulness feedback section */}
            <div className="p-4 rounded-xl bg-slate-50 border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-text-primary">
                Did this article resolve your problem?
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(selectedArticle.id, true)}
                  disabled={!!votedArticles[selectedArticle.id]}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    votedArticles[selectedArticle.id] === 'up'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-border'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Yes, thanks!</span>
                </button>
                <button
                  onClick={() => handleVote(selectedArticle.id, false)}
                  disabled={!!votedArticles[selectedArticle.id]}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    votedArticles[selectedArticle.id] === 'down'
                      ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-border'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
                  <span>No, open a ticket</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Link
                to="/portal/tickets/new"
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Still stuck? Escalate to Support Agent →
              </Link>
              <button
                onClick={() => setSearchParams({})}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
