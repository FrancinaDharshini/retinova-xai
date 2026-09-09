import { useRef } from 'react';
import {
  FileText,
  Download,
  Printer,
  Share2,
  ArrowLeft,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Heart,
  ListChecks,
  CircleDot,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getGradeInfo, formatDate, cn } from '@/lib/constants';
import type { AnalysisResult, Page } from '@/types';

interface ReportPageProps {
  result: AnalysisResult;
  imageDataUrl: string;
  patientId: string;
  screeningId: string;
  onNavigate: (page: Page) => void;
  onDoctorReview: () => void;
}

export function ReportPage({
  result,
  imageDataUrl,
  patientId,
  onNavigate,
  onDoctorReview,
}: ReportPageProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const gradeInfo = getGradeInfo(result.dr_grade);
  const report = result.report;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = generateReportText(result, patientId);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RETINOVA_Screening_${patientId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="rounded-lg p-2 text-secondary hover:bg-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">AI Screening Report</h1>
            <p className="text-sm text-secondary mt-1">Structured report generated from model outputs</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 no-print">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Download Report
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
          <Share2 className="h-4 w-4" />
          Share with Doctor
        </Button>
        <Button size="sm" onClick={onDoctorReview}>
          <Stethoscope className="h-4 w-4" />
          Doctor Review
        </Button>
      </div>

      {/* Report Card */}
      <div ref={reportRef} className="card p-6 sm:p-8 space-y-6">
        {/* Report Header */}
        <div className="flex items-start justify-between border-b border-card pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-brand shadow-glow">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">RETINOVA Screening Report</h2>
              <p className="text-xs text-tertiary">Explainable AI Diabetic Retinopathy Screening Assistant</p>
            </div>
          </div>
          <Badge variant={result.model_status === 'CONNECTED' ? 'success' : 'warning'}>
            {result.model_status === 'CONNECTED' ? 'Model Connected' : 'DEMO MODE'}
          </Badge>
        </div>

        {/* Patient + Screening Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoItem label="Patient ID" value={patientId} mono />
          <InfoItem label="Screening Date" value={formatDate(new Date())} />
          <InfoItem label="Image Quality" value={result.quality_status} valueColor={result.quality_status === 'GOOD' ? '#22c55e' : '#ef4444'} />
          <InfoItem label="Model Status" value={result.model_status === 'CONNECTED' ? 'Connected' : 'DEMO MODE'} />
        </div>

        {/* Key Results */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoItem label="DR Grade" value={gradeInfo.label} valueColor={gradeInfo.color} />
          <InfoItem label="Severity" value={result.severity_label} valueColor={gradeInfo.color} />
          <InfoItem label="Confidence" value={`${result.confidence}%`} />
          <InfoItem label="Referral Priority" value={result.priority} valueColor={result.priority === 'HIGH' ? '#ef4444' : result.priority === 'MODERATE' ? '#f97316' : '#22c55e'} />
        </div>

        {/* Image */}
        {imageDataUrl && (
          <div>
            <h3 className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">Retinal Image</h3>
            <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 max-w-md">
              <img src={imageDataUrl} alt="Retinal image" className="w-full h-48 object-contain" />
            </div>
          </div>
        )}

        {/* Screening Summary */}
        <ReportSection title="Screening Summary" icon={<Info className="h-4 w-4" />}>
          <p className="text-sm text-primary leading-relaxed">{report.summary}</p>
        </ReportSection>

        {/* Patient-Friendly Summary */}
        <div className={cn(
          'rounded-2xl p-5 border-2',
          report.urgency_level === 'green' && 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20',
          report.urgency_level === 'yellow' && 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20',
          report.urgency_level === 'red' && 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20',
        )}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl',
              report.urgency_level === 'green' && 'bg-green-100 dark:bg-green-900 text-green-600',
              report.urgency_level === 'yellow' && 'bg-amber-100 dark:bg-amber-900 text-amber-600',
              report.urgency_level === 'red' && 'bg-red-100 dark:bg-red-900 text-red-600',
            )}>
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-primary">What This Means For You</h3>
              <p className="text-xs text-secondary">Plain-language summary — no medical jargon</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <CircleDot className={cn(
                'h-3 w-3',
                report.urgency_level === 'green' && 'text-green-500',
                report.urgency_level === 'yellow' && 'text-amber-500',
                report.urgency_level === 'red' && 'text-red-500 animate-pulse-soft',
              )} />
              <span className={cn(
                'text-xs font-bold uppercase tracking-wider',
                report.urgency_level === 'green' && 'text-green-600 dark:text-green-400',
                report.urgency_level === 'yellow' && 'text-amber-600 dark:text-amber-400',
                report.urgency_level === 'red' && 'text-red-600 dark:text-red-400',
              )}>
                {report.urgency_level === 'green' ? 'No Concern' : report.urgency_level === 'yellow' ? 'Follow-Up Needed' : 'Urgent Review'}
              </span>
            </div>
          </div>
          <p className="text-sm text-primary leading-relaxed">{report.patient_summary}</p>

          <div className="mt-4 pt-4 border-t border-card/50">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-4 w-4 text-brand-500" />
              <h4 className="text-sm font-semibold text-primary">What You Should Do Next</h4>
            </div>
            <ol className="space-y-2">
              {report.patient_next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-primary pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* AI Assessment */}
        <ReportSection title="AI Assessment" icon={<CheckCircle2 className="h-4 w-4" />}>
          <p className="text-sm text-primary leading-relaxed">{report.ai_assessment}</p>
        </ReportSection>

        {/* Model Confidence */}
        <ReportSection title="Model Confidence" icon={<Info className="h-4 w-4" />}>
          <p className="text-sm text-primary leading-relaxed">{report.model_confidence}</p>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {[
              { label: 'G0', val: result.class_probabilities.grade_0 },
              { label: 'G1', val: result.class_probabilities.grade_1 },
              { label: 'G2', val: result.class_probabilities.grade_2 },
              { label: 'G3', val: result.class_probabilities.grade_3 },
              { label: 'G4', val: result.class_probabilities.grade_4 },
            ].map((p) => (
              <div key={p.label} className="text-center p-2 rounded-lg bg-hover">
                <p className="text-xs font-bold text-primary">{(p.val * 100).toFixed(1)}%</p>
                <p className="text-[10px] text-tertiary">{p.label}</p>
              </div>
            ))}
          </div>
        </ReportSection>

        {/* Image Quality */}
        <ReportSection title="Image Quality" icon={<ShieldCheck className="h-4 w-4" />}>
          <p className="text-sm text-primary leading-relaxed">{report.image_quality_note}</p>
        </ReportSection>

        {/* AI-Supported Findings */}
        <ReportSection title="AI-Supported Findings" icon={<CheckCircle2 className="h-4 w-4" />}>
          <ul className="space-y-2">
            {report.ai_supported_findings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-primary">
                <span className="text-brand-500 mt-1">•</span>
                {f}
              </li>
            ))}
          </ul>
        </ReportSection>

        {/* Referral Priority */}
        <ReportSection title="Referral Priority" icon={<AlertTriangle className="h-4 w-4" />}>
          <div className="flex items-center gap-2">
            <Badge variant={result.priority === 'HIGH' ? 'danger' : result.priority === 'MODERATE' ? 'warning' : 'success'} size="md">
              {result.priority}
            </Badge>
            {result.referable && (
              <span className="text-sm text-secondary">Potentially referable for specialist review</span>
            )}
          </div>
        </ReportSection>

        {/* Recommendation */}
        <ReportSection title="Recommendation" icon={<Stethoscope className="h-4 w-4" />}>
          <p className="text-sm text-primary leading-relaxed">{report.recommendation}</p>
        </ReportSection>

        {/* Doctor Review Section */}
        <ReportSection title="Doctor Review" icon={<Stethoscope className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem label="AI Recommendation" value={result.referable ? 'Refer to specialist' : 'No referral indicated'} />
            <InfoItem label="Doctor Decision" value="Pending review" />
            <InfoItem label="Review Status" value="PENDING" />
            <InfoItem label="Reviewer" value="—" />
          </div>
        </ReportSection>

        {/* Disclaimer */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Important Disclaimer</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 leading-relaxed">{report.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <Button variant="outline" onClick={() => onNavigate('dashboard')} fullWidth>
          <ArrowLeft className="h-4 w-4" />
          Return to Dashboard
        </Button>
        <Button onClick={onDoctorReview} fullWidth>
          <Stethoscope className="h-4 w-4" />
          Proceed to Doctor Review
        </Button>
      </div>
    </div>
  );
}

function InfoItem({ label, value, valueColor, mono }: { label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-tertiary uppercase tracking-wider mb-1">{label}</p>
      <p
        className={cn('text-sm font-semibold', mono && 'font-mono')}
        style={{ color: valueColor ?? 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  );
}

function ReportSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-primary uppercase tracking-wider">{title}</h3>
      </div>
      <div className="pl-10">{children}</div>
    </div>
  );
}

function generateReportText(result: AnalysisResult, patientId: string): string {
  const r = result.report;
  return `RETINOVA — AI SCREENING REPORT
================================

Patient ID: ${patientId}
Screening Date: ${formatDate(new Date())}
Model Status: ${result.model_status}

RESULTS
-------
DR Grade: ${getGradeInfo(result.dr_grade).label} (${result.severity_label})
Confidence: ${result.confidence}%
Image Quality: ${result.quality_status} (${result.quality_score}%)
Referral Priority: ${result.priority}
Referable: ${result.referable ? 'Yes' : 'No'}

WHAT THIS MEANS FOR YOU (PATIENT SUMMARY)
-----------------------------------------
${r.patient_summary}

WHAT YOU SHOULD DO NEXT
-----------------------
${r.patient_next_steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

SCREENING SUMMARY
-----------------
${r.summary}

AI ASSESSMENT
-------------
${r.ai_assessment}

MODEL CONFIDENCE
----------------
${r.model_confidence}

IMAGE QUALITY
-------------
${r.image_quality_note}

AI-SUPPORTED FINDINGS
---------------------
${r.ai_supported_findings.map((f) => `- ${f}`).join('\n')}

REFERRAL PRIORITY
-----------------
${r.referral_priority}

RECOMMENDATION
--------------
${r.recommendation}

DISCLAIMER
----------
${r.disclaimer}
`;
}
