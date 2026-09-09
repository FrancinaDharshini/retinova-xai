import { useCallback, useRef, useState } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  ScanLine,
  Brain,
  Lightbulb,
  FileText,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { analyzeImage } from '@/lib/aiService';
import { saveScreening } from '@/lib/screeningService';
import { generateDemoPatientId, cn } from '@/lib/constants';
import type { AnalysisResult, Page, ProcessingStep } from '@/types';

interface ScreeningPageProps {
  onAnalysisComplete: (result: AnalysisResult, imageDataUrl: string, screeningId: string, patientId: string) => void;
  onNavigate: (page: Page) => void;
}

const steps: { id: number; label: string; icon: typeof ScanLine }[] = [
  { id: 1, label: 'Upload', icon: Upload },
  { id: 2, label: 'Quality Check', icon: ScanLine },
  { id: 3, label: 'AI Analysis', icon: Brain },
  { id: 4, label: 'Explanation', icon: Lightbulb },
  { id: 5, label: 'Report', icon: FileText },
  { id: 6, label: 'Doctor Review', icon: Stethoscope },
];

const processingSteps = [
  'Validating image',
  'Checking quality',
  'Running AI model',
  'Generating Grad-CAM',
  'Preparing screening report',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function ScreeningPage({ onAnalysisComplete, onNavigate }: ScreeningPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [activeProcessingStep, setActiveProcessingStep] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setError(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported file format. Please upload a JPG or PNG image.');
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const removeImage = () => {
    setFile(null);
    setImagePreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const runAnalysis = async () => {
    if (!file || !imagePreview) return;

    setAnalyzing(true);
    setError(null);
    setCurrentStep(2);

    // Animate processing steps
    for (let i = 0; i < processingSteps.length; i++) {
      setActiveProcessingStep(i);
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
    }

    try {
      const result = await analyzeImage(file);

      if (result.quality_status === 'POOR') {
        setActiveProcessingStep(-1);
        setAnalyzing(false);
        setError(
          result.image_quality.issues[0] ??
            'Image quality is insufficient for reliable screening. Please upload a clearer retinal image.',
        );
        return;
      }

      // Save to database
      const patientId = generateDemoPatientId();
      const screening = await saveScreening({
        patient_demo_id: patientId,
        screening_date: new Date().toISOString(),
        image_quality: result.quality_status,
        quality_score: result.quality_score,
        dr_grade: result.dr_grade,
        severity: result.severity_label,
        confidence: result.confidence,
        referable: result.referable,
        priority: result.priority,
        review_status: 'PENDING',
        doctor_decision: null,
        doctor_comment: null,
        reviewer: null,
        reviewed_at: null,
        report: result.report,
        image_url: imagePreview,
        gradcam_url: result.gradcam_image,
        class_probabilities: result.class_probabilities,
        model_status: result.model_status,
        processing_time_ms: result.processing_time_ms,
      });

      setActiveProcessingStep(-1);
      setAnalyzing(false);
      setCurrentStep(5);

      onAnalysisComplete(result, imagePreview, screening?.id ?? '', patientId);
    } catch {
      setActiveProcessingStep(-1);
      setAnalyzing(false);
      setError('Unable to analyze this image. The AI analysis service encountered an error. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">New Retinal Screening</h1>
        <p className="text-sm text-secondary mt-1">Upload a retinal/fundus image for AI-assisted DR screening</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
                    isDone && 'bg-green-500 text-white',
                    isActive && 'step-indicator-active shadow-glow scale-110',
                    !isActive && !isDone && 'bg-slate-100 dark:bg-slate-800 text-tertiary',
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    (isActive || isDone) ? 'text-primary' : 'text-tertiary',
                  )}
                >
                  {String(step.id).padStart(2, '0')} {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-8 sm:w-16 mx-2 transition-colors duration-300',
                    currentStep > step.id ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Area + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <Card>
          <h3 className="font-bold text-primary mb-4">Upload Retinal Image</h3>

          {!imagePreview ? (
            <div
              onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300',
                dragActive
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 scale-[1.02]'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-hover',
              )}
            >
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-500 mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <p className="font-semibold text-primary mb-1">Drag and drop retinal image here</p>
              <p className="text-sm text-secondary mb-4">or click to browse</p>
              <div className="flex items-center justify-center gap-2 text-xs text-tertiary">
                <Badge variant="neutral">JPG</Badge>
                <Badge variant="neutral">JPEG</Badge>
                <Badge variant="neutral">PNG</Badge>
                <span className="ml-1">Max 10MB</span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-black/5 dark:bg-black/20">
                <img src={imagePreview} alt="Retinal image preview" className="w-full h-64 object-contain" />
                <button
                  onClick={removeImage}
                  className="absolute top-3 right-3 rounded-lg bg-black/60 text-white p-1.5 hover:bg-black/80 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-secondary">
                <FileCheck className="h-4 w-4 text-green-500" />
                <span className="font-medium text-primary">{file?.name}</span>
                <span className="text-tertiary">·</span>
                <span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''}</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={runAnalysis} disabled={analyzing} size="lg" fullWidth>
                  {analyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ScanLine className="h-5 w-5" />
                      Analyze Retinal Image
                    </>
                  )}
                </Button>
                <Button onClick={removeImage} variant="outline" size="lg" disabled={analyzing}>
                  <X className="h-5 w-5" />
                  Remove
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 animate-fade-in">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">Unable to analyze this image.</p>
                <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">Reason: {error}</p>
                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                  Please upload a clearer retinal image.
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Processing Animation / Info */}
        <Card>
          <h3 className="font-bold text-primary mb-4">AI Processing Pipeline</h3>

          {analyzing ? (
            <div className="space-y-4">
              {processingSteps.map((step, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-all duration-300',
                    activeProcessingStep === i && 'bg-brand-50 dark:bg-brand-950/50 scale-[1.02]',
                    activeProcessingStep > i && 'opacity-60',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-all',
                      activeProcessingStep > i && 'bg-green-100 dark:bg-green-950 text-green-600',
                      activeProcessingStep === i && 'bg-brand-100 dark:bg-brand-950 text-brand-600',
                      activeProcessingStep < i && 'bg-slate-100 dark:bg-slate-800 text-tertiary',
                    )}
                  >
                    {activeProcessingStep > i ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : activeProcessingStep === i ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-colors',
                      activeProcessingStep >= i ? 'text-primary' : 'text-tertiary',
                    )}
                  >
                    {step}
                  </span>
                </div>
              ))}

              {/* Scanning animation overlay */}
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden mt-4">
                  <img src={imagePreview} alt="Analyzing" className="w-full h-40 object-contain opacity-60" />
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent shadow-glow"
                      style={{ animation: 'scan 2s ease-in-out infinite' }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { icon: ScanLine, title: 'Image Quality Gate', desc: 'Laplacian blur detection, brightness & illumination analysis' },
                { icon: Brain, title: 'DR Classification', desc: 'EfficientNet-B0 model predicts Grade 0–4 with confidence scores' },
                { icon: Lightbulb, title: 'Grad-CAM Explanation', desc: 'Heatmap overlay showing regions that influenced the prediction' },
                { icon: FileText, title: 'LLM Screening Report', desc: 'Structured report generated from model outputs — no hallucination' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-hover">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{item.title}</p>
                      <p className="text-xs text-secondary mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  Running in DEMO MODE. Results are derived from image heuristics, not a trained clinical model. Never present as clinical predictions.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-card">
        <ImageIcon className="h-5 w-5 text-tertiary shrink-0 mt-0.5" />
        <p className="text-xs text-tertiary leading-relaxed">
          Prototype environment. Use anonymized or synthetic data for demonstrations. Production deployment requires appropriate authentication, encryption, access control, audit logging and applicable healthcare/data-protection compliance. Synthetic patient IDs only — no real personal data stored.
        </p>
      </div>
    </div>
  );
}
