import React, { useState } from 'react';
import { dataService, useDataService } from '../../services/dataService';
import { PageHeader } from '../../components/common/PageHeader';
import { TicketPriority } from '../../types';
import {
  BrainCircuit,
  Sparkles,
  Calculator,
  Info,
  Clock,
  BarChart2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const PredictionsPage: React.FC = () => {
  useDataService();
  const [tab, setTab] = useState<'predict' | 'performance' | 'importance' | 'architecture'>('predict');
  const [categoryId, setCategoryId] = useState<number>(4);
  const [issueType, setIssueType] = useState('VPN Connection');
  const [priority, setPriority] = useState<TicketPriority>('High');
  const [departmentId, setDepartmentId] = useState<number>(4);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [predictionResult, setPredictionResult] = useState(() =>
    dataService.predictResolutionTime({
      category_id: 4,
      issue_type: 'VPN Connection',
      priority: 'High',
      department_id: 4
    })
  );

  const categories = dataService.getCategories();
  const departments = dataService.getDepartments();

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueType.trim()) {
      setValidationError('Please enter a valid issue type description.');
      return;
    }
    setValidationError(null);
    setIsEvaluating(true);

    setTimeout(() => {
      try {
        const result = dataService.predictResolutionTime({
          category_id: categoryId,
          issue_type: issueType.trim(),
          priority,
          department_id: departmentId
        });
        setPredictionResult(result);
      } catch (err: any) {
        setValidationError(err?.message || 'Error executing resolution prediction.');
      } finally {
        setIsEvaluating(false);
      }
    }, 250);
  };

  // Feature importance data
  const featureImportanceData = [
    { feature: 'Priority Tier', importance: 42 },
    { feature: 'Service Category', importance: 28 },
    { feature: 'Requester Department', importance: 18 },
    { feature: 'Day of Week & Hour', importance: 12 }
  ];

  // Baseline vs ML Model Candidate benchmark table
  const modelComparison = [
    {
      model: 'Governed Baseline (Mean Predictor)',
      mae: '13.53 hrs',
      rmse: '25.68 hrs',
      status: 'Empirical Historical Reference',
      description: 'Predicts constant dataset mean turnaround duration (14.9 hrs) across 6,612 resolved tickets'
    },
    {
      model: 'Priority Cohort Stratification',
      mae: '9.70 hrs',
      rmse: '19.92 hrs',
      status: 'Rule-Based Grouping Baseline',
      description: 'Stratifies by priority SLA tiers (Critical 2.2h, High 4.4h, Medium 12.7h, Low 39.1h)'
    },
    {
      model: 'Ridge Linear Regression (Simulation)',
      mae: '6.12 hrs',
      rmse: '8.45 hrs',
      status: 'Experimental Candidate',
      description: 'One-hot encoded category and priority features with L2 weight regularization'
    },
    {
      model: 'LightGBM Gradient Boosting (Simulation)',
      mae: '3.42 hrs',
      rmse: '5.18 hrs',
      status: 'Offline Study Benchmark',
      description: 'Offline tree-based candidate with non-linear feature interaction depth'
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resolution Time Prediction"
        subtitle="Estimate ticket resolution duration upon ticket submission using supervised machine learning."
        showSyntheticDisclaimer={true}
        breadcrumbs={[
          { label: 'Analytics', path: '/analytics/overview' },
          { label: 'Resolution Time Prediction' }
        ]}
      />

      {/* Tabs matching mockup screen 13 */}
      <div className="flex items-center gap-3 border-b border-border text-xs font-semibold">
        <button
          onClick={() => setTab('predict')}
          className={`pb-2.5 px-1 transition-all ${
            tab === 'predict'
              ? 'border-b-2 border-brand-600 text-brand-600 font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Predict New Ticket
        </button>
        <button
          onClick={() => setTab('performance')}
          className={`pb-2.5 px-1 transition-all ${
            tab === 'performance'
              ? 'border-b-2 border-brand-600 text-brand-600 font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Model Performance & Evaluation
        </button>
        <button
          onClick={() => setTab('importance')}
          className={`pb-2.5 px-1 transition-all ${
            tab === 'importance'
              ? 'border-b-2 border-brand-600 text-brand-600 font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Feature Importance
        </button>
        <button
          onClick={() => setTab('architecture')}
          className={`pb-2.5 px-1 transition-all ${
            tab === 'architecture'
              ? 'border-b-2 border-brand-600 text-brand-600 font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Production Model Integration Roadmap
        </button>
      </div>

      {tab === 'predict' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form (Left 7 cols) matching mockup Screen 13 */}
          <div className="lg:col-span-7 bg-surface rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-brand-600" />
              <h3 className="font-bold text-sm text-text-primary">Ticket Creation Features</h3>
            </div>
            <p className="text-xs text-text-secondary mb-5">
              Only features available at ticket creation time are eligible for input. Post-resolution variables are strictly excluded.
            </p>

            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handlePredict} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.category_id} value={c.category_id}>
                        {c.category_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Issue Type
                  </label>
                  <input
                    type="text"
                    value={issueType}
                    onChange={(e) => {
                      setIssueType(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="e.g. VPN Connection, Battery replacement"
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    <option value="Critical">Critical (4h SLA)</option>
                    <option value="High">High (8h SLA)</option>
                    <option value="Medium">Medium (24h SLA)</option>
                    <option value="Low">Low (72h SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-1.5">
                    Department
                  </label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    {departments.map((d) => (
                      <option key={d.department_id} value={d.department_id}>
                        {d.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isEvaluating}
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
                  <span>{isEvaluating ? 'Evaluating Features...' : 'Predict Resolution Time'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Prediction Result Panel (Right 5 cols) */}
          <div className="lg:col-span-5 bg-surface rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary">Prediction Result (Experimental Baseline)</span>
              <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-semibold px-2 py-0.5 rounded">
                Governed Empirical Baseline
              </span>
            </div>

            <div className="text-center py-4 space-y-1">
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                Estimated Resolution Time
              </span>
              <div className="text-4xl font-black text-brand-600 tracking-tight flex items-center justify-center gap-1">
                {isEvaluating ? (
                  <span className="text-2xl text-slate-400 font-normal py-2">Computing...</span>
                ) : (
                  <>
                    <span>{predictionResult.estimatedHours}</span>
                    <span className="text-xl font-bold text-text-secondary">hours</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estimated Confidence Window: {predictionResult.confidenceLower}h – {predictionResult.confidenceUpper}h
              </p>
            </div>

            <div className="bg-white rounded-lg p-3 border border-border text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Target SLA Window:</span>
                <span className="font-semibold text-text-primary">
                  {priority === 'Critical' ? '4.0h' : priority === 'High' ? '8.0h' : priority === 'Medium' ? '24.0h' : '72.0h'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Expected Outcome:</span>
                <span className="font-semibold text-emerald-600">
                  {predictionResult.estimatedHours <= (priority === 'Critical' ? 4 : priority === 'High' ? 8 : 24)
                    ? 'Projected SLA Compliant'
                    : 'Projected At-Risk / Breach'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Empirical Baseline Notice:</strong> Predictions are generated from historical ticket duration medians across priority and category cohorts. This demonstration does not claim live ML model inference.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Operational Boundary:</strong> This is an empirical cohort estimation for resource forecasting. It does not replace operational SLA commitments or priority triage dispatch rules.
              </span>
            </div>
          </div>
        </div>
      )}

      {tab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-surface rounded-xl border border-border shadow-card p-6">
            <h3 className="font-bold text-sm text-text-primary mb-1">
              Model Evaluation & Benchmark Comparison
            </h3>
            <p className="text-xs text-text-secondary mb-4">
              Evaluated on 8,000 synthetic ticket transactions using a strict 80/20 chronological time-aware split (6,400 training / 1,600 test records).
            </p>

            {/* Data Governance Audit Callout */}
            <div className="mb-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-950 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>DATA GOVERNANCE AUDIT: CANDIDATE MODEL BENCHMARK (STATUS: REVIEW — DQ-ML-01)</span>
              </div>
              <p className="text-amber-900 leading-relaxed text-[11px]">
                <strong>Benchmark Provenance:</strong> The candidate model performance metrics (<span className="font-mono">MAE = 3.42 hrs</span>, <span className="font-mono">RMSE = 5.18 hrs</span>, <span className="font-mono">R² = 0.784</span>) reflect an offline supervised learning study conducted on the governed synthetic dataset baseline (Seed 42, 80/20 chronological split).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/80">
                  <span className="font-semibold text-amber-950 block">Feature Leakage Guard</span>
                  <span className="text-amber-800">Only creation-time variables eligible. Post-resolution variables strictly excluded from input vector.</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/80">
                  <span className="font-semibold text-amber-950 block">Inference Boundary</span>
                  <span className="text-amber-800">Client-side parameterized heuristic. Does not represent a live production microservice connection.</span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/80">
                  <span className="font-semibold text-amber-950 block">Governance Status</span>
                  <span className="text-amber-800 font-medium">Under active review. Must not be represented as a certified production forecasting SLA guarantee.</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Candidate Architecture</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">MAE</th>
                    <th className="py-2.5 px-3 text-right">RMSE</th>
                    <th className="py-2.5 px-3">Evaluation Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modelComparison.map((m, idx) => (
                    <tr key={idx} className={idx === 1 ? 'bg-brand-50/30' : ''}>
                      <td className="py-3 px-3 text-text-primary font-semibold flex items-center gap-2">
                        {idx === 1 && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                        {m.model}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          m.status.includes('Historical') ? 'bg-slate-100 text-slate-700' :
                          m.status.includes('Grouping') ? 'bg-brand-100 text-brand-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-text-primary">{m.mae}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">{m.rmse}</td>
                      <td className="py-3 px-3 text-text-secondary">{m.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'importance' && (
        <div className="bg-surface rounded-xl border border-border shadow-card p-6">
          <h3 className="font-bold text-sm text-text-primary mb-1">
            Feature Importance (Empirical Information Gain)
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Relative contribution of ticket creation attributes in predicting resolution duration across historical tickets.
          </p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={featureImportanceData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" unit="%" fontSize={11} stroke="#64748B" />
                <YAxis type="category" dataKey="feature" fontSize={11} stroke="#64748B" width={140} />
                <Tooltip
                  formatter={(val: number) => [`${val}%`, 'Relative Importance']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="importance" fill="#4F46E5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'architecture' && (
        <div className="bg-surface rounded-xl border border-border shadow-card p-6 space-y-6 text-xs">
          <div>
            <h3 className="font-bold text-sm text-text-primary mb-1">
              Production Machine Learning Integration Blueprint
            </h3>
            <p className="text-text-secondary">
              Architectural prerequisites, data contracts, and verification gates required before deploying live production inference.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="font-bold text-text-primary block text-xs">1. Endpoint & Serving Contract</span>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                Genuine ML inference requires an asynchronous microservice endpoint (e.g. FastAPI / Triton Inference Server on GCP Vertex AI or AWS SageMaker) exposing a <code className="bg-white px-1 py-0.5 rounded border border-slate-200">POST /api/v1/predict/resolution</code> contract accepting strictly verified creation-time features.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="font-bold text-text-primary block text-xs">2. Cold-Start & Offline Fallback</span>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                In the event of network timeouts (&gt;250ms), missing API tokens, or unmapped category embeddings, the application must transparently fall back to the governed empirical baseline without crashing or presenting unverified synthetic numbers as live predictions.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="font-bold text-text-primary block text-xs">3. Feature Leakage Safeguards</span>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                Features strictly forbidden during inference: <code className="text-red-700 bg-red-50 px-1 py-0.5 rounded">resolved_at</code>, <code className="text-red-700 bg-red-50 px-1 py-0.5 rounded">resolution_time_hours</code>, <code className="text-red-700 bg-red-50 px-1 py-0.5 rounded">satisfaction_rating</code>, <code className="text-red-700 bg-red-50 px-1 py-0.5 rounded">comments</code>. Any feature leakage disqualifies the candidate model from deployment.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="font-bold text-text-primary block text-xs">4. Continuous Drift Monitoring</span>
              <p className="text-text-secondary leading-relaxed text-[11px]">
                Prediction error distributions must be tracked against ground truth when tickets are resolved. Scheduled retrain jobs must be governed by change control (DQ-ML-01) with versioned model weights and audit logging.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
