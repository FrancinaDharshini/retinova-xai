import { Settings as SettingsIcon, Sun, Moon, Shield, Database, Bell, Info } from 'lucide-react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { getModelStatus } from '@/lib/aiService';
import { cn } from '@/lib/constants';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const modelStatus = getModelStatus();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Settings</h1>
        <p className="text-sm text-secondary mt-1">Application preferences and configuration</p>
      </div>

      {/* Theme */}
      <Card>
        <SectionTitle title="Appearance" subtitle="Choose light or dark theme" icon={<SettingsIcon className="h-5 w-5" />} />
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setTheme('light')}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
              theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30' : 'border-card hover:bg-hover',
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <Sun className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-primary">Light Theme</p>
              <p className="text-xs text-secondary">Bright clinical interface</p>
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={cn(
              'flex items-center gap-3 p-4 rounded-xl border-2 transition-all',
              theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30' : 'border-card hover:bg-hover',
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700 text-slate-300">
              <Moon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-primary">Dark Theme</p>
              <p className="text-xs text-secondary">Premium dark medical AI</p>
            </div>
          </button>
        </div>
      </Card>

      {/* Model Configuration */}
      <Card>
        <SectionTitle title="Model Configuration" subtitle="AI model and backend connection status" icon={<Database className="h-5 w-5" />} />
        <div className="space-y-3">
          <SettingRow label="Model Status">
            <Badge variant={modelStatus === 'CONNECTED' ? 'success' : 'warning'} size="md">
              {modelStatus === 'CONNECTED' ? 'Connected' : 'DEMO MODE'}
            </Badge>
          </SettingRow>
          <SettingRow label="Backend URL">
            <code className="text-sm text-secondary font-mono">
              {import.meta.env.VITE_BACKEND_URL || 'Not configured (DEMO MODE)'}
            </code>
          </SettingRow>
          <SettingRow label="Model Architecture">
            <span className="text-sm text-secondary">EfficientNet-B0 / ResNet50</span>
          </SettingRow>
          <SettingRow label="Backend Framework">
            <span className="text-sm text-secondary">FastAPI + PyTorch</span>
          </SettingRow>
        </div>
        <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-400">
            To connect the trained model, set VITE_BACKEND_URL to your FastAPI endpoint. The AI service layer (aiService.ts) will automatically switch from DEMO MODE to real predictions.
          </p>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionTitle title="Notifications" subtitle="Screening alerts and review reminders" icon={<Bell className="h-5 w-5" />} />
        <div className="space-y-3">
          <SettingRow label="Pending review alerts">
            <ToggleSwitch defaultOn />
          </SettingRow>
          <SettingRow label="Referable case alerts">
            <ToggleSwitch defaultOn />
          </SettingRow>
          <SettingRow label="Quality failure alerts">
            <ToggleSwitch defaultOn />
          </SettingRow>
          <SettingRow label="Email notifications">
            <ToggleSwitch />
          </SettingRow>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <SectionTitle title="Privacy & Security" subtitle="Data protection and compliance" icon={<Shield className="h-5 w-5" />} />
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-secondary leading-relaxed">
            Prototype environment. Use anonymized or synthetic data for demonstrations. Production deployment requires appropriate authentication, encryption, access control, audit logging and applicable healthcare/data-protection compliance.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoBox icon={Shield} text="No real patient data stored" />
          <InfoBox icon={Database} text="Synthetic demo IDs only" />
        </div>
      </Card>

      {/* About */}
      <Card>
        <SectionTitle title="About RETINOVA" subtitle="Product information" icon={<Info className="h-5 w-5" />} />
        <div className="space-y-2 text-sm text-secondary">
          <p><span className="font-semibold text-primary">Product:</span> RETINOVA — Explainable AI Diabetic Retinopathy Screening Assistant</p>
          <p><span className="font-semibold text-primary">Tagline:</span> Check. Predict. Explain. Refer.</p>
          <p><span className="font-semibold text-primary">Positioning:</span> An explainable AI screening assistant for diabetic retinopathy.</p>
          <p><span className="font-semibold text-primary">Version:</span> Prototype (DEMO MODE)</p>
          <p><span className="font-semibold text-primary">Validation:</span> NOT CLINICALLY VALIDATED</p>
        </div>
      </Card>
    </div>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-card last:border-0">
      <span className="text-sm font-medium text-primary">{label}</span>
      {children}
    </div>
  );
}

function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultOn} className="sr-only peer" />
      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500" />
    </label>
  );
}

function InfoBox({ icon: Icon, text }: { icon: typeof Shield; text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-hover">
      <Icon className="h-4 w-4 text-brand-500 shrink-0" />
      <span className="text-xs text-secondary">{text}</span>
    </div>
  );
}
