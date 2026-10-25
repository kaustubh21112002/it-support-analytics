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
  const [tab, setTab] = useState<'predict' | 'performance' | 'importance'>('predict');
  const [categoryId, setCategoryId] = useState<number>(4);
  const [issueType, setIssueType] = useState('VPN Connection');
  const [priority, setPriority] = useState<TicketPriority>('High');
  const [departmentId, setDepartmentId] = useState<number>(4);

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
    const result = dataService.predictResolutionTime({
      category_id: categoryId,
      issue_type: issueType,
      priority,
      department_id: departmentId
    });
    setPredictionResult(result);
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
      model: 'Baseline (Mean Predictor)',
      mae: '11.80 hrs',
      rmse: '15.42 hrs',
      r2: '0.000',
      description: 'Predicts constant dataset mean duration (14.9 hrs)'
    },
    {
      model: 'Ridge Linear Regression',
      mae: '6.12 hrs',
      rmse: '8.45 hrs',
      r2: '0.521',
      description: 'One-hot encoded category and priority features'
    },
    {
      model: 'LightGBM Gradient Boosting',
      mae: '3.42 hrs',
      rmse: '5.18 hrs',
      r2: '0.784',
      description: 'Champion candidate with non-linear interaction trees'
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
                    onChange={(e) => setIssueType(e.target.value)}
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
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Predict Resolution Time</span>
                </button>
              </div>
            </form>
          </div>

          {/* Prediction Result Panel (Right 5 cols) */}
          <div className="lg:col-span-5 bg-surface rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-xs font-bold text-text-primary">Prediction Result (Demo)</span>
              <span className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 font-semibold px-2 py-0.5 rounded">
                Simulated LightGBM Heuristic (Experimental)
              </span>
            </div>

            <div className="text-center py-4 space-y-1">
              <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold">
                Estimated Resolution Time
              </span>
              <div className="text-4xl font-black text-brand-600 tracking-tight flex items-center justify-center gap-1">
                <span>{predictionResult.estimatedHours}</span>
                <span className="text-xl font-bold text-text-secondary">hours</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Confidence Range: {predictionResult.confidenceLower}h – {predictionResult.confidenceUpper}h
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
                <strong>Operational Boundary:</strong> This is a statistical estimation for resource forecasting. It does not replace operational SLA commitments or priority triage rules.
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
                    <th className="py-2.5 px-3">Mean Absolute Error (MAE)</th>
                    <th className="py-2.5 px-3">Root Mean Square Error (RMSE)</th>
                    <th className="py-2.5 px-3">R-Squared (R²)</th>
                    <th className="py-2.5 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {modelComparison.map((m, idx) => (
                    <tr key={idx} className={idx === 2 ? 'bg-indigo-50/40 font-semibold' : ''}>
                      <td className="py-3 px-3 text-text-primary flex items-center gap-2">
                        {idx === 2 && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600" />}
                        {m.model}
                      </td>
                      <td className="py-3 px-3 text-text-primary">{m.mae}</td>
                      <td className="py-3 px-3 text-text-primary">{m.rmse}</td>
                      <td className="py-3 px-3 text-brand-600 font-bold">{m.r2}</td>
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
            Feature Importance (LightGBM Gini Gain)
          </h3>
          <p className="text-xs text-text-secondary mb-6">
            Relative contribution of ticket creation attributes in predicting resolution duration.
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
    </div>
  );
};
