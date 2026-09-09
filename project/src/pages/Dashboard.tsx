import { useEffect, useState } from 'react';
import {
  Activity,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  Plus,
  Eye,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getScreenings, getDashboardStats } from '@/lib/screeningService';
import { getGradeInfo, formatDateShort, cn } from '@/lib/constants';
import type { Screening, Page } from '@/types';

interface DashboardProps {
  onNavigate: (page: Page) => void;
  onViewScreening: (id: string) => void;
}

export function Dashboard({ onNavigate, onViewScreening }: DashboardProps) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, referable: 0, recapture: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [s, st] = await Promise.all([getScreenings(), getDashboardStats()]);
    setScreenings(s);
    setStats(st);
    setLoading(false);
  }

  const statCards = [
    { label: 'Total Screenings', value: stats.total, icon: Activity, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-100 dark:bg-brand-950' },
    { label: "Today's Screenings", value: stats.today, icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950' },
    { label: 'Potentially Referable', value: stats.referable, icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950' },
    { label: 'Images Requiring Recapture', value: stats.recapture, icon: RefreshCw, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950' },
    { label: 'Pending Doctor Reviews', value: stats.pending, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-secondary mt-1">Overview of screening activity and pending reviews</p>
        </div>
        <Button onClick={() => onNavigate('screening')} size="lg">
          <Plus className="h-5 w-5" />
          Start New Screening
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="animate-fade-in-up" >
              <div className="flex items-center justify-between mb-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', card.bg)}>
                  <Icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {loading ? <span className="skeleton inline-block w-12 h-8 rounded" /> : card.value}
              </p>
              <p className="text-xs text-secondary mt-1 font-medium">{card.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Recent Screenings */}
      <Card className="overflow-hidden">
        <SectionTitle
          title="Recent Screenings"
          subtitle="Latest retinal screening records"
          icon={<Activity className="h-5 w-5" />}
          action={
            <Button variant="ghost" size="sm" onClick={() => onNavigate('reports')}>
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          }
        />

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : screenings.length === 0 ? (
          <EmptyState onNavigate={onNavigate} />
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-tertiary uppercase tracking-wider border-b border-card">
                  <th className="pb-3 pr-4 font-semibold">Patient ID</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Image Quality</th>
                  <th className="pb-3 pr-4 font-semibold">DR Grade</th>
                  <th className="pb-3 pr-4 font-semibold">Confidence</th>
                  <th className="pb-3 pr-4 font-semibold">Priority</th>
                  <th className="pb-3 pr-4 font-semibold">Review</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card">
                {screenings.slice(0, 10).map((s) => {
                  const gradeInfo = getGradeInfo(s.dr_grade);
                  return (
                    <tr key={s.id} className="hover:bg-hover transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-primary font-medium">{s.patient_demo_id}</td>
                      <td className="py-3 pr-4 text-secondary">{formatDateShort(s.screening_date)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={s.image_quality === 'GOOD' ? 'success' : 'danger'}>
                          {s.image_quality}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold" style={{ color: gradeInfo.color }}>
                          {gradeInfo.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-secondary tabular-nums">{s.confidence}%</td>
                      <td className="py-3 pr-4">
                        <PriorityBadge priority={s.priority} />
                      </td>
                      <td className="py-3 pr-4">
                        <ReviewStatusBadge status={s.review_status} />
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onViewScreening(s.id)}
                          className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 hover:underline text-xs font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function EmptyState({ onNavigate }: { onNavigate: (p: Page) => void }) {
  return (
    <div className="text-center py-12">
      <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-500 mb-4">
        <FileText className="h-8 w-8" />
      </div>
      <h3 className="font-semibold text-primary mb-1">No screenings yet</h3>
      <p className="text-sm text-secondary mb-4">Start your first retinal screening to see records here.</p>
      <Button onClick={() => onNavigate('screening')}>
        <Plus className="h-4 w-4" />
        Start New Screening
      </Button>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const variant = priority === 'HIGH' ? 'danger' : priority === 'MODERATE' ? 'warning' : 'success';
  return <Badge variant={variant as 'danger' | 'warning' | 'success'}>{priority}</Badge>;
}

function ReviewStatusBadge({ status }: { status: string }) {
  if (status === 'CONFIRMED') return <Badge variant="success">Confirmed</Badge>;
  if (status === 'OVERRIDDEN') return <Badge variant="warning">Overridden</Badge>;
  return <Badge variant="neutral">Pending</Badge>;
}
