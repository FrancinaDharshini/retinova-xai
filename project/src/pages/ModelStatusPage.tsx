import {
  Cpu,
  Brain,
  Layers,
  Lightbulb,
  Server,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Target,
} from 'lucide-react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getModelStatus } from '@/lib/aiService';

export function ModelStatusPage() {
  const modelStatus = getModelStatus();

  const specs = [
    { label: 'Model', value: 'EfficientNet-B0 / ResNet50', icon: Brain },
    { label: 'Task', value: 'DR Classification', icon: Activity },
    { label: 'Classes', value: '5', icon: Layers },
    { label: 'Grades', value: '0–4', icon: Layers },
    { label: 'Framework', value: 'PyTorch', icon: Cpu },
    { label: 'Explainability', value: 'Grad-CAM', icon: Lightbulb },
    { label: 'Backend', value: 'FastAPI', icon: Server },
  ];

  const targets = [
    { label: 'Sensitivity Target', value: '>90%', note: 'True positive rate for referable DR detection' },
    { label: 'Specificity Target', value: '>85%', note: 'True negative rate for non-referable cases' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Model Status</h1>
        <p className="text-sm text-secondary mt-1">Technical transparency — model architecture and validation status</p>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-2xl p-6 border-2 ${
          modelStatus === 'CONNECTED'
            ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
            : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              modelStatus === 'CONNECTED'
                ? 'bg-green-100 dark:bg-green-900 text-green-600'
                : 'bg-amber-100 dark:bg-amber-900 text-amber-600'
            }`}
          >
            {modelStatus === 'CONNECTED' ? <CheckCircle2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-primary">Model Status: {modelStatus}</h2>
              <Badge variant={modelStatus === 'CONNECTED' ? 'success' : 'warning'} size="md">
                {modelStatus === 'CONNECTED' ? 'Connected' : 'DEMO MODE'}
              </Badge>
            </div>
            <p className="text-sm text-secondary">
              {modelStatus === 'CONNECTED'
                ? 'The AI model endpoint is connected and processing real predictions.'
                : 'The trained model is not connected. Results are generated from image heuristics for demonstration purposes only. Never present as clinical predictions.'}
            </p>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      <div className="rounded-2xl p-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-red-500 shrink-0" />
        <div>
          <h3 className="font-bold text-red-700 dark:text-red-400">Validation Status: NOT CLINICALLY VALIDATED</h3>
          <p className="text-sm text-red-600 dark:text-red-500 mt-1">
            This prototype has not undergone clinical validation. Do not use for actual patient care. All results are for demonstration purposes only.
          </p>
        </div>
      </div>

      {/* Technical Specs */}
      <Card>
        <SectionTitle title="Technical Specifications" subtitle="Model architecture and deployment details" icon={<Cpu className="h-5 w-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specs.map((spec, i) => {
            const Icon = spec.icon;
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-hover">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-tertiary uppercase tracking-wider">{spec.label}</p>
                  <p className="text-sm font-semibold text-primary">{spec.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Performance Targets */}
      <Card>
        <SectionTitle title="Performance Targets" subtitle="Expected performance — NOT measured results" icon={<Target className="h-5 w-5" />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {targets.map((t, i) => (
            <div key={i} className="p-4 rounded-xl bg-hover">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-primary">{t.label}</span>
                <Badge variant="info" size="md">{t.value}</Badge>
              </div>
              <p className="text-xs text-secondary">{t.note}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 dark:text-blue-400">
            These are TARGETS, not measured results. Do not fabricate model performance. Actual validation metrics must be supplied before any performance claims can be made.
          </p>
        </div>
      </Card>

      {/* API Integration */}
      <Card>
        <SectionTitle title="API Integration" subtitle="Backend endpoints for model connection" icon={<Server className="h-5 w-5" />} />
        <div className="space-y-2">
          {[
            { method: 'POST', path: '/api/analyze', desc: 'Full analysis pipeline (quality + DR + Grad-CAM + report)' },
            { method: 'POST', path: '/api/quality-check', desc: 'Image quality gate only' },
            { method: 'POST', path: '/api/report', desc: 'LLM screening report generation' },
            { method: 'GET', path: '/api/screenings', desc: 'List screening records' },
            { method: 'GET', path: '/api/screenings/:id', desc: 'Single screening record' },
            { method: 'POST', path: '/api/screenings/:id/review', desc: 'Doctor review submission' },
          ].map((ep, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-hover">
              <Badge variant={ep.method === 'GET' ? 'success' : 'info'}>{ep.method}</Badge>
              <code className="text-sm font-mono text-primary font-medium">{ep.path}</code>
              <span className="text-xs text-tertiary ml-auto hidden sm:block">{ep.desc}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-card">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-secondary leading-relaxed">
          This is a prototype for demonstration purposes. The model is not clinically validated. Never fabricate model performance. Never claim clinical accuracy unless actual validation metrics are supplied. Always label prototype/model status honestly.
        </p>
      </div>
    </div>
  );
}
