import {
  Eye,
  Image as ImageIcon,
  ScanLine,
  Brain,
  Lightbulb,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Activity,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getModelStatus } from '@/lib/aiService';
import { Button } from '@/components/ui/Button';
import { Sun, Moon } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

const workflowSteps = [
  { icon: ImageIcon, label: 'Retinal Image', desc: 'Fundus image upload' },
  { icon: ScanLine, label: 'Quality Check', desc: 'Blur, brightness, illumination' },
  { icon: Brain, label: 'AI Grading', desc: 'DR Grade 0–4 prediction' },
  { icon: Lightbulb, label: 'Explanation', desc: 'Grad-CAM interpretability' },
  { icon: Stethoscope, label: 'Specialist Review', desc: 'Human-in-the-loop' },
];

export function LandingPage({ onEnter }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const modelStatus = getModelStatus();

  return (
    <div className="min-h-screen bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-brand-400/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand shadow-glow">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-primary text-xl tracking-tight">RETINOVA</span>
            <p className="text-[10px] text-tertiary -mt-0.5 tracking-wider">AI SCREENING ASSISTANT</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse-soft" />
            PROTOTYPE · DEMO MODE
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-secondary hover:bg-hover transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-12 sm:pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6 animate-fade-in-down">
          <Sparkles className="h-4 w-4" />
          AI Screening Assistant — Human-in-the-Loop
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-primary mb-4 animate-fade-in-up">
          <span className="gradient-text">RETINOVA</span>
        </h1>

        <p className="text-xl sm:text-2xl font-semibold text-primary mb-3 animate-fade-in-up animate-delay-100">
          Explainable AI for Faster Diabetic Retinopathy Screening
        </p>

        <p className="text-lg sm:text-xl text-secondary mb-10 animate-fade-in-up animate-delay-200">
          Check. Predict. Explain. Refer.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16 animate-fade-in-up animate-delay-300">
          <Button size="lg" onClick={onEnter} className="shadow-glow">
            Enter Platform
            <ArrowRight className="h-5 w-5" />
          </Button>
          <span className="text-sm text-tertiary flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            AI-assisted assessment · Not autonomous diagnosis
          </span>
        </div>

        {/* Workflow Visualization */}
        <div className="animate-fade-in-up animate-delay-500">
          <p className="text-sm font-semibold text-tertiary uppercase tracking-wider mb-6">
            Screening Workflow
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2">
            {workflowSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex flex-col md:flex-row items-center gap-3 md:gap-2">
                  <div className="card p-4 w-44 text-center hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group">
                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-2 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-primary">{step.label}</p>
                    <p className="text-xs text-tertiary mt-0.5">{step.desc}</p>
                  </div>
                  {i < workflowSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-tertiary rotate-90 md:rotate-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: ScanLine, title: 'Quality Gate', desc: 'Laplacian blur detection, brightness & illumination analysis before AI prediction' },
            { icon: Brain, title: 'DR Grading', desc: 'EfficientNet-B0 / ResNet50 for Grade 0–4 classification with confidence scores' },
            { icon: Lightbulb, title: 'Explainability', desc: 'Grad-CAM heatmap overlay showing regions that influenced the model prediction' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="card p-6 animate-fade-in-up" style={{ animationDelay: `${600 + i * 100}ms` }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 mb-3">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-primary mb-1">{f.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Info */}
      <div className="relative z-10 border-t border-card">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-tertiary">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-4 w-4" />
                Model: {modelStatus === 'CONNECTED' ? 'Connected' : 'DEMO MODE'}
              </span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                Not Clinically Validated
              </span>
            </div>
            <p className="text-xs max-w-md text-center sm:text-right">
              AI-generated screening support only. Final clinical assessment remains with an ophthalmologist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
