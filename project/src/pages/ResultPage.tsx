import { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Gauge,
  Eye,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCcw,
  Lightbulb,
  FileText,
  Stethoscope,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DR_GRADES, getGradeInfo, cn } from '@/lib/constants';
import type { AnalysisResult, Page } from '@/types';

interface ResultPageProps {
  result: AnalysisResult;
  imageDataUrl: string;
  screeningId: string;
  onNavigate: (page: Page) => void;
  onViewReport: () => void;
  onDoctorReview: () => void;
}

type ViewerTab = 'original' | 'gradcam' | 'overlay';

export function ResultPage({
  result,
  imageDataUrl,
  onNavigate,
  onViewReport,
  onDoctorReview,
}: ResultPageProps) {
  const [activeTab, setActiveTab] = useState<ViewerTab>('original');
  const [zoom, setZoom] = useState(1);
  const [opacity, setOpacity] = useState(0.6);
  const [fullscreen, setFullscreen] = useState(false);

  const gradeInfo = getGradeInfo(result.dr_grade);
  const probs = result.class_probabilities;
  const probArray = [probs.grade_0, probs.grade_1, probs.grade_2, probs.grade_3, probs.grade_4];
  const urgency = result.report.urgency_level;
  const urgencyConfig = {
    green: { label: 'No Concern', desc: 'No signs of diabetic eye damage found', color: '#22c55e', bg: 'bg-green-50 dark:bg-green-950/20', border: 'border-green-300 dark:border-green-800' },
    yellow: { label: 'Follow-Up Needed', desc: 'Changes detected — please see an eye specialist', color: '#f97316', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-300 dark:border-amber-800' },
    red: { label: 'Urgent Review', desc: 'Serious changes detected — see a specialist urgently', color: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-300 dark:border-red-800' },
  };
  const uc = urgencyConfig[urgency];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="rounded-lg p-2 text-secondary hover:bg-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Screening Result</h1>
            <p className="text-sm text-secondary mt-1">AI-assisted assessment — review required by ophthalmologist</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onViewReport}>
            <FileText className="h-4 w-4" />
            View Report
          </Button>
          <Button size="sm" onClick={onDoctorReview}>
            <Stethoscope className="h-4 w-4" />
            Doctor Review
          </Button>
        </div>
      </div>

      {/* Urgency Banner */}
      <div className={cn('rounded-2xl p-4 border-2 flex items-center gap-4 animate-fade-in-up', uc.bg, uc.border)}>
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white text-2xl font-bold"
          style={{ backgroundColor: uc.color }}
        >
          {urgency === 'green' ? <CheckCircle2 className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary">{uc.label}</h2>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: uc.color }}
            >
              {uc.label}
            </span>
          </div>
          <p className="text-sm text-secondary mt-0.5">{uc.desc}</p>
          <p className="text-xs text-tertiary mt-1">{result.report.patient_summary}</p>
        </div>
      </div>

      {/* Top Result Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ResultCard
          icon={<Activity className="h-5 w-5" />}
          label="DR Grade"
          value={gradeInfo.label}
          valueColor={gradeInfo.color}
        />
        <ResultCard
          icon={<ShieldAlert className="h-5 w-5" />}
          label="Severity"
          value={result.severity_label}
          valueColor={gradeInfo.color}
        />
        <ResultCard
          icon={<Gauge className="h-5 w-5" />}
          label="Confidence"
          value={`${result.confidence}%`}
        />
        <ResultCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Referral"
          value={result.referable ? 'Potentially Referable' : 'Not Referable'}
          valueColor={result.referable ? '#f97316' : '#22c55e'}
        />
        <ResultCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Priority"
          value={result.priority}
          valueColor={result.priority === 'HIGH' ? '#ef4444' : result.priority === 'MODERATE' ? '#f97316' : '#22c55e'}
        />
        <ResultCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Image Quality"
          value={result.quality_status}
          valueColor={result.quality_status === 'GOOD' ? '#22c55e' : '#ef4444'}
        />
      </div>

      {/* Severity Visualization */}
      <Card>
        <h3 className="font-bold text-primary mb-4">Severity Scale — Grade 0 to Grade 4</h3>
        <div className="flex items-center gap-2 sm:gap-4">
          {DR_GRADES.map((g) => {
            const isPredicted = g.grade === result.dr_grade;
            return (
              <div key={g.grade} className="flex-1 text-center">
                <div
                  className={cn(
                    'rounded-xl p-3 sm:p-4 transition-all duration-500',
                    isPredicted ? 'scale-105 shadow-lg' : 'opacity-50',
                  )}
                  style={{
                    backgroundColor: isPredicted ? g.bgColor : undefined,
                    border: isPredicted ? `2px solid ${g.color}` : '2px solid transparent',
                  }}
                >
                  <div
                    className="mx-auto h-2 sm:h-3 rounded-full mb-2"
                    style={{ backgroundColor: g.color, width: isPredicted ? '100%' : '40%' }}
                  />
                  <p className="text-xs font-bold" style={{ color: g.color }}>{g.label}</p>
                  <p className="text-[10px] sm:text-xs text-secondary mt-0.5 hidden sm:block">{g.severity}</p>
                  {isPredicted && (
                    <Badge variant="default" size="sm" className="mt-2">
                      <Eye className="h-3 w-3" />
                      Predicted
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-tertiary mt-4 text-center">
          Referral recommendation is for specialist review and is not a treatment decision.
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Viewer */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary">Retinal Image Analysis</h3>
            <div className="flex items-center gap-1">
              <ViewerTabButton tab="original" active={activeTab} onClick={setActiveTab} label="Original" />
              <ViewerTabButton tab="gradcam" active={activeTab} onClick={setActiveTab} label="Grad-CAM" />
              <ViewerTabButton tab="overlay" active={activeTab} onClick={setActiveTab} label="Overlay" />
            </div>
          </div>

          {/* Image Display */}
          <div
            className={cn(
              'relative rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center',
              fullscreen ? 'fixed inset-0 z-50 bg-black/90' : 'h-80 sm:h-96',
            )}
          >
            {activeTab === 'original' && (
              <img
                src={imageDataUrl}
                alt="Original retinal image"
                className="max-w-full max-h-full object-contain transition-transform duration-300"
                style={{ transform: `scale(${zoom})` }}
              />
            )}

            {activeTab === 'gradcam' && (
              result.gradcam_image ? (
                <img
                  src={result.gradcam_image}
                  alt="Grad-CAM heatmap"
                  className="max-w-full max-h-full object-contain transition-transform duration-300"
                  style={{ transform: `scale(${zoom})` }}
                />
              ) : (
                <GradCAMUnavailable />
              )
            )}

            {activeTab === 'overlay' && (
              result.gradcam_image ? (
                <div className="relative max-w-full max-h-full">
                  <img src={imageDataUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                  <img
                    src={result.gradcam_image}
                    alt="Grad-CAM overlay"
                    className="absolute inset-0 max-w-full max-h-full object-contain mix-blend-multiply"
                    style={{ opacity }}
                  />
                </div>
              ) : (
                <GradCAMUnavailable />
              )
            )}

            {/* Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-xl bg-black/60 backdrop-blur-sm p-1">
              <ViewerControl icon={ZoomOut} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} />
              <ViewerControl icon={ZoomIn} onClick={() => setZoom((z) => Math.min(3, z + 0.25))} />
              <ViewerControl icon={Maximize} onClick={() => setZoom(1)} label="Fit" />
              <ViewerControl
                icon={fullscreen ? Minimize : Maximize}
                onClick={() => setFullscreen((f) => !f)}
                label={fullscreen ? 'Exit' : 'Full'}
              />
              <ViewerControl icon={RotateCcw} onClick={() => { setZoom(1); setOpacity(0.6); }} label="Reset" />
            </div>

            {/* Opacity slider for overlay */}
            {activeTab === 'overlay' && result.gradcam_image && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-black/60 backdrop-blur-sm px-3 py-1.5">
                <span className="text-xs text-white font-medium">Heatmap Opacity</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-24 accent-brand-500"
                />
                <span className="text-xs text-white tabular-nums">{Math.round(opacity * 100)}%</span>
              </div>
            )}
          </div>

          {/* Grad-CAM Disclaimer */}
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Grad-CAM highlights image regions that influenced the model prediction. It is an interpretability aid and does not prove the presence of a lesion.
            </p>
          </div>
        </Card>

        {/* Probability Chart */}
        <Card>
          <h3 className="font-bold text-primary mb-1">Class Probabilities</h3>
          <p className="text-xs text-secondary mb-4">Model confidence per DR grade</p>

          <div className="space-y-3">
            {DR_GRADES.map((g, i) => {
              const prob = probArray[i] * 100;
              const isMax = g.grade === result.dr_grade;
              return (
                <div key={g.grade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-primary">{g.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: g.color }}>
                      {prob.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${prob}%`,
                        backgroundColor: g.color,
                        boxShadow: isMax ? `0 0 10px ${g.color}80` : 'none',
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-tertiary mt-0.5">{g.severity}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">Predicted Grade</span>
              <span className="text-lg font-bold" style={{ color: gradeInfo.color }}>
                {gradeInfo.label}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-semibold text-primary">Confidence</span>
              <span className="text-lg font-bold text-primary">{result.confidence}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Why did the model predict this? */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-primary">Why did the model predict this?</h3>
            <p className="text-xs text-secondary">Model-supported explanation</p>
          </div>
        </div>

        <div className="space-y-2">
          {result.findings.length > 0 ? (
            result.findings.map((finding, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-hover animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                <p className="text-sm text-primary">{finding}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-secondary">No specific findings were detected by the model beyond the overall grade classification.</p>
          )}
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <p className="text-xs text-secondary italic">
            The model placed greater importance on these regions. This is an interpretability aid and does not prove the presence of a lesion.
          </p>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => onNavigate('dashboard')} fullWidth>
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Button>
        <Button variant="outline" onClick={onViewReport} fullWidth>
          <FileText className="h-4 w-4" />
          View Full Report
        </Button>
        <Button onClick={onDoctorReview} fullWidth>
          <Stethoscope className="h-4 w-4" />
          Doctor Review
        </Button>
      </div>
    </div>
  );
}

function ResultCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Card className="animate-fade-in-up">
      <div className="flex items-center gap-2 text-tertiary mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold" style={{ color: valueColor ?? 'var(--text-primary)' }}>
        {value}
      </p>
    </Card>
  );
}

function ViewerTabButton({
  tab,
  active,
  onClick,
  label,
}: {
  tab: ViewerTab;
  active: ViewerTab;
  onClick: (t: ViewerTab) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onClick(tab)}
      className={cn(
        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
        active === tab
          ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
          : 'text-secondary hover:bg-hover',
      )}
    >
      {label}
    </button>
  );
}

function ViewerControl({
  icon: Icon,
  onClick,
  label,
}: {
  icon: typeof ZoomIn;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-white hover:bg-white/20 transition-colors text-xs"
    >
      <Icon className="h-4 w-4" />
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}

function GradCAMUnavailable() {
  return (
    <div className="text-center px-6 py-12">
      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-slate-200 dark:bg-slate-800 text-tertiary mb-4">
        <Lightbulb className="h-8 w-8" />
      </div>
      <p className="font-semibold text-secondary mb-1">Model explanation unavailable</p>
      <p className="text-sm text-tertiary max-w-xs mx-auto">
        Grad-CAM heatmap is not available in DEMO MODE. A trained model is required to generate interpretability visualizations.
      </p>
    </div>
  );
}
