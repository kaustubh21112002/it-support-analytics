import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { PriorityBadge } from '../../components/common/Badges';
import { TicketPriority } from '../../types';
import {
  FileText,
  Tag,
  CheckCircle2,
  Paperclip,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertTriangle,
  Upload
} from 'lucide-react';

export const CreateTicketPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [issueType, setIssueType] = useState('Active Directory account lock');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [createdTicketId, setCreatedTicketId] = useState<string | null>(null);

  const categories = dataService.getCategories();
  const departments = dataService.getDepartments();

  // Governed SLA Priority suggestion based on category & impact
  const suggestedPriority: TicketPriority = categoryId === 1 ? 'High' : categoryId === 4 ? 'High' : 'Medium';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const names = Array.from(e.target.files).map(f => f.name);
      setAttachedFiles([...attachedFiles, ...names]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) return;

    const newTicket = dataService.createTicket({
      subject,
      description,
      category_id: categoryId,
      issue_type: issueType,
      department_id: user?.departmentId || 4,
      requester_name: user?.name || 'Priya Sharma',
      requester_email: user?.email || 'priya.sharma@company.com'
    });

    setCreatedTicketId(newTicket.ticket_id);
  };

  if (createdTicketId) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-surface rounded-2xl border border-border shadow-card p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Ticket Successfully Created!</h2>
          <p className="text-sm text-text-secondary">
            Your support request has been logged in the governed queue.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-4 inline-block text-left">
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary">Assigned ID:</span>
              <span className="text-lg font-bold text-brand-600">{createdTicketId}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-text-secondary">Governed Priority:</span>
              <PriorityBadge priority={suggestedPriority} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to={`/portal/tickets/${createdTicketId}`}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm transition-all"
            >
              View Ticket Conversation
            </Link>
            <Link
              to="/portal/tickets"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-text-primary font-medium rounded-lg text-xs transition-all"
            >
              Return to My Tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Create a New Ticket"
        subtitle="Describe your issue and our automated triage engine will dispatch it to the appropriate support group."
        breadcrumbs={[
          { label: 'Portal', path: '/portal' },
          { label: 'Tickets', path: '/portal/tickets' },
          { label: 'New Request' }
        ]}
      />

      {/* Stepper Navigation matching Screen 6 */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            1
          </span>
          <span className={`text-xs font-semibold ${step >= 1 ? 'text-text-primary' : 'text-slate-400'}`}>
            Issue Details
          </span>
        </div>
        <div className="w-12 h-0.5 bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            2
          </span>
          <span className={`text-xs font-semibold ${step >= 2 ? 'text-text-primary' : 'text-slate-400'}`}>
            Category & Priority
          </span>
        </div>
        <div className="w-12 h-0.5 bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step >= 3 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}>
            3
          </span>
          <span className={`text-xs font-semibold ${step >= 3 ? 'text-text-primary' : 'text-slate-400'}`}>
            Review & Submit
          </span>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Cannot access shared network drive from corporate laptop"
                  className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Detailed Description *
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the symptoms, any error messages displayed, and steps already attempted..."
                  className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => subject && description ? setStep(2) : alert('Please provide a subject and description.')}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span>Next: Category & Impact</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Category & Priority */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Service Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name} ({c.subcategory_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Specific Issue Type
                  </label>
                  <input
                    type="text"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    placeholder="e.g. VPN connection timeout, Outlook calendar desync"
                    className="w-full px-3.5 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Governed SLA Entitlement Policy Callout */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">
                      Governed Priority Assignment: <PriorityBadge priority={suggestedPriority} />
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">SLA Rule #{categoryId === 1 ? 2 : 3}</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  In accordance with governed ITIL service guidelines, ticket priority and target resolution SLAs are determined based on service category, impact level, and system urgency. End-users cannot unilaterally escalate priority to bypass standard operational queues.
                </p>
              </div>

              {/* Attachments Section */}
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1.5">
                  Attach Screenshots or Log Files (Optional)
                </label>
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    id="ticket-file-upload"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="ticket-file-upload" className="cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                    <span className="text-xs font-medium text-brand-600 hover:underline">
                      Click to browse files
                    </span>
                    <span className="text-xs text-text-secondary"> or drag and drop</span>
                    <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF, TXT up to 10MB</p>
                  </label>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachedFiles.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-xs text-slate-700">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span>Review & Confirmation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Subject:</span>
                  <p className="text-text-primary font-bold text-sm mt-0.5">{subject}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Description:</span>
                  <p className="text-text-primary whitespace-pre-line mt-0.5 bg-white p-3 rounded border border-slate-200">
                    {description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500">Service Category:</span>
                    <p className="font-semibold text-text-primary">
                      {categories.find(c => c.category_id === categoryId)?.category_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Governed SLA:</span>
                    <p className="font-semibold text-text-primary">
                      {suggestedPriority} Priority ({categoryId === 1 ? '8h' : '24h'} Target)
                    </p>
                  </div>
                </div>
                {attachedFiles.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Attachments ({attachedFiles.length}):</span>
                    <p className="text-text-primary font-medium">{attachedFiles.join(', ')}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text-primary rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Service Ticket</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
