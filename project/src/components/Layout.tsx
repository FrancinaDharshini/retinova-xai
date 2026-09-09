import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  LayoutDashboard,
  ScanLine,
  Users,
  FileText,
  BarChart3,
  Cpu,
  Settings,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getModelStatus } from '@/lib/aiService';
import { cn } from '@/lib/constants';
import type { Page } from '@/types';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'screening', label: 'Screening', icon: ScanLine },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'model-status', label: 'Model Status', icon: Cpu },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const modelStatus = getModelStatus();

  const handleNav = (page: Page) => {
    onNavigate(page);
    setMobileNavOpen(false);
  };

  return (
    <div className="min-h-screen bg-primary flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 bg-sidebar border-r border-card z-30">
        <SidebarContent currentPage={currentPage} onNavigate={handleNav} modelStatus={modelStatus} />
      </aside>

      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-sidebar border-r border-card animate-slide-in-right">
            <SidebarContent currentPage={currentPage} onNavigate={handleNav} modelStatus={modelStatus} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 glass border-b border-card">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden rounded-lg p-2 text-secondary hover:bg-hover"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-primary text-lg tracking-tight">RETINOVA</span>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm font-medium text-secondary">
                  {navItems.find((n) => n.id === currentPage)?.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Demo Mode Indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-xs font-semibold">
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

              <button
                className="relative rounded-lg p-2 text-secondary hover:bg-hover transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-bold">
                  DR
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-primary leading-tight">Dr. Reviewer</p>
                  <p className="text-xs text-tertiary">Ophthalmologist</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-card px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-tertiary">
            <p>RETINOVA — Explainable AI Screening Assistant · Prototype</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              AI screening support only · Final clinical decision remains with an ophthalmologist
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarContent({
  currentPage,
  onNavigate,
  modelStatus,
}: {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  modelStatus: string;
}) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-card">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-glow">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-primary text-lg tracking-tight">RETINOVA</span>
            <p className="text-[10px] text-tertiary -mt-1 tracking-wider">AI SCREENING</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-sm'
                  : 'text-secondary hover:bg-hover hover:text-primary',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active && 'text-white')} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Model Status Badge */}
      <div className="px-3 py-3 border-t border-card">
        <div className="rounded-xl bg-slate-100 dark:bg-slate-800/50 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className={cn('h-4 w-4', modelStatus === 'CONNECTED' ? 'text-green-500' : 'text-amber-500')} />
            <span className="text-xs font-semibold text-primary">Model Status</span>
          </div>
          <p className="text-xs text-tertiary ml-6">
            {modelStatus === 'CONNECTED' ? 'Connected' : 'DEMO MODE — Not Connected'}
          </p>
        </div>
      </div>
    </>
  );
}
