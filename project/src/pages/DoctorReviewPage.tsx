import { useState } from 'react';
import {
  Stethoscope,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  Lightbulb,
  FileText,
  AlertTriangle,
  Info,
  Clock,
  User,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { getGradeInfo, formatDate, cn } from '@/lib/constants';
import { updateScreeningReview } from '@/lib/screeningService';
import type { AnalysisResult, DoctorDecision, Page } from '@/types';

interface DoctorReviewPageProps {
  result: AnalysisResult;
  imageDataUrl: string;
  patientId: string;
  screeningId: string;
  onNavigate: (page: Page) => void;
  onReviewComplete: () => void;
}

export function DoctorReviewPage({
  result,
  imageDataUrl,
  patientId,
  screeningId,
  onNavigate,
  onReviewComplete,
}: DoctorReviewPageProps) {
  const [decision, setDecision] = useState<DoctorDecision>(null);
  const [comment, setComment] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const gradeInfo = getGradeInfo(result.dr_grade);

  const handleConfirm = async () => {
    setSubmitting(true);
    await updateScreeningReview(
      screeningId,
      'CONFIRM',
      null,
      'Dr. Reviewer',
      'CONFIRMED',
    );
    setSubmitting(false);
    setCompleted(true);
    setDecision('CONFIRM');
  };

  const handleOverride = async () => {
    if (!comment.trim()) {
      setShowOverrideModal(true);
      return;
    }
    setSubmitting(true);
    await updateScreeningReview(
      screeningId,
      'OVERRIDE',
      comment,
      'Dr. Reviewer',
      'OVERRIDDEN',
    );
    setSubmitting(false);
    setCompleted(true);
    setDecision('OVERRIDE');
    setShowOverrideModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="rounded-lg p-2 text-secondary hover:bg-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">Doctor Review</h1>
            <p className="text-sm text-secondary mt-1">Human-in-the-loop — the doctor remains the final authority</p>
          </div>
        </div>
        <Badge variant={completed ? 'success' : 'warning'} size="md">
          {completed ? 'Reviewed' : 'Pending Review'}
        </Badge>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Original Image */}
        <Card>
          <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600">
              <FileText className="h-4 w-4" />
            </div>
            Original Image
          </h3>
          <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/20">
            <img src={imageDataUrl} alt="Original retinal image" className="w-full h-48 object-contain" />
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-tertiary">Patient ID</span>
              <span className="font-mono text-primary">{patientId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tertiary">Image Quality</span>
              <span className="font-medium" style={{ color: result.quality_status === 'GOOD' ? '#22c55e' : '#ef4444' }}>
                {result.quality_status} ({result.quality_score}%)
              </span>
            </div>
          </div>
        </Card>

        {/* Center: Grad-CAM */}
        <Card>
          <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
              <Lightbulb className="h-4 w-4" />
            </div>
            Grad-CAM
          </h3>
          {result.gradcam_image ? (
            <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/20">
              <img src={result.gradcam_image} alt="Grad-CAM" className="w-full h-48 object-contain" />
            </div>
          ) : (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800/50 h-48 flex items-center justify-center text-center px-4">
              <div>
                <Lightbulb className="h-8 w-8 text-tertiary mx-auto mb-2" />
                <p className="text-sm text-secondary font-medium">Model explanation unavailable</p>
                <p className="text-xs text-tertiary">Grad-CAM not available in DEMO MODE</p>
              </div>
            </div>
          )}
          <div className="mt-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Grad-CAM is an interpretability aid and does not prove the presence of a lesion.
            </p>
          </div>
        </Card>

        {/* Right: AI Result + Report */}
        <Card>
          <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600">
              <Stethoscope className="h-4 w-4" />
            </div>
            AI Result + Report
          </h3>

          <div className="space-y-3">
            <ResultRow label="DR Grade" value={gradeInfo.label} valueColor={gradeInfo.color} />
            <ResultRow label="Severity" value={result.severity_label} valueColor={gradeInfo.color} />
            <ResultRow label="Confidence" value={`${result.confidence}%`} />
            <ResultRow
              label="Referral"
              value={result.referable ? 'Potentially Referable' : 'Not Referable'}
              valueColor={result.referable ? '#f97316' : '#22c55e'}
            />
            <ResultRow
              label="Priority"
              value={result.priority}
              valueColor={result.priority === 'HIGH' ? '#ef4444' : result.priority === 'MODERATE' ? '#f97316' : '#22c55e'}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-card">
            <p className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">AI Recommendation</p>
            <p className="text-sm text-secondary leading-relaxed">{result.report.recommendation}</p>
          </div>
        </Card>
      </div>

      {/* Doctor Decision */}
      <Card>
        <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600">
            <Stethoscope className="h-5 w-5" />
          </div>
          Doctor Decision
        </h3>

        {!completed ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                  decision === 'CONFIRM'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                    : 'border-card hover:border-green-400 hover:bg-hover',
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-primary">Confirm AI Result</p>
                  <p className="text-xs text-secondary">Agree with the AI prediction</p>
                </div>
              </button>

              <button
                onClick={() => setShowOverrideModal(true)}
                disabled={submitting}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200',
                  decision === 'OVERRIDE'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-card hover:border-amber-400 hover:bg-hover',
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-primary">Override Result</p>
                  <p className="text-xs text-secondary">Doctor assessment differs from AI</p>
                </div>
              </button>
            </div>

            {submitting && (
              <div className="flex items-center gap-2 text-sm text-secondary">
                <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Saving review...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl',
                decision === 'CONFIRM'
                  ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                  : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900',
              )}
            >
              {decision === 'CONFIRM' ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <Edit3 className="h-6 w-6 text-amber-500" />
              )}
              <div>
                <p className="font-semibold text-primary">
                  {decision === 'CONFIRM' ? 'AI Result Confirmed' : 'Result Overridden'}
                </p>
                <p className="text-sm text-secondary">
                  {decision === 'CONFIRM'
                    ? 'The AI prediction has been confirmed by the doctor.'
                    : 'The doctor has overridden the AI prediction.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-tertiary uppercase tracking-wider mb-1">AI Recommendation</p>
                <p className="font-medium text-primary">{result.referable ? 'Refer to specialist' : 'No referral'}</p>
              </div>
              <div>
                <p className="text-xs text-tertiary uppercase tracking-wider mb-1">Doctor Decision</p>
                <p className="font-medium text-primary">{decision === 'CONFIRM' ? 'Confirmed AI result' : 'Overridden'}</p>
              </div>
              <div>
                <p className="text-xs text-tertiary uppercase tracking-wider mb-1">Review Status</p>
                <Badge variant={decision === 'CONFIRM' ? 'success' : 'warning'}>
                  {decision === 'CONFIRM' ? 'CONFIRMED' : 'OVERRIDDEN'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-tertiary uppercase tracking-wider mb-1">Reviewer</p>
                <p className="font-medium text-primary flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Dr. Reviewer
                </p>
              </div>
              <div>
                <p className="text-xs text-tertiary uppercase tracking-wider mb-1">Timestamp</p>
                <p className="font-medium text-primary flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(new Date())}
                </p>
              </div>
            </div>

            {decision === 'OVERRIDE' && comment && (
              <div>
                <p className="text-xs text-tertiary uppercase tracking-wider mb-1">Override Reason</p>
                <p className="text-sm text-secondary p-3 rounded-lg bg-hover">{comment}</p>
              </div>
            )}

            <Button onClick={onReviewComplete} fullWidth>
              Return to Dashboard
            </Button>
          </div>
        )}
      </Card>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400">
          The doctor always remains the final authority. AI screening support only — final clinical assessment remains with an ophthalmologist.
        </p>
      </div>

      {/* Override Modal */}
      <Modal open={showOverrideModal} onClose={() => setShowOverrideModal(false)} title="Override AI Result" size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              A reason or comment is required when overriding the AI result.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-primary block mb-2">
              Reason / Comment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="e.g., Doctor assessment differs from AI prediction. Clinical examination suggests..."
              className="w-full rounded-xl border border-card bg-bg-secondary px-4 py-3 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowOverrideModal(false)} fullWidth>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={!comment.trim() || submitting}
              fullWidth
            >
              {submitting ? 'Saving...' : 'Submit Override'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ResultRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-card last:border-0">
      <span className="text-sm text-secondary">{label}</span>
      <span className="text-sm font-semibold" style={{ color: valueColor ?? 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}
