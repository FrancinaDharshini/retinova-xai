import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Clock } from 'lucide-react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getScreenings } from '@/lib/screeningService';
import { DR_GRADES, cn } from '@/lib/constants';
import type { Screening } from '@/types';

export function AnalyticsPage() {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScreenings().then((s) => {
      setScreenings(s);
      setLoading(false);
    });
  }, []);

  const total = screenings.length;
  const gradeCounts = [0, 0, 0, 0, 0];
  const qualityPass = screenings.filter((s) => s.image_quality === 'GOOD').length;
  const qualityFail = screenings.filter((s) => s.image_quality === 'POOR').length;
  const referableCount = screenings.filter((s) => s.referable).length;
  const pendingCount = screenings.filter((s) => s.review_status === 'PENDING').length;
  const avgProcessingTime =
    total > 0 ? Math.round(screenings.reduce((sum, s) => sum + s.processing_time_ms, 0) / total) : 0;

  screenings.forEach((s) => {
    if (s.dr_grade >= 0 && s.dr_grade <= 4) gradeCounts[s.dr_grade]++;
  });

  const maxGradeCount = Math.max(...gradeCounts, 1);
  const passRate = total > 0 ? Math.round((qualityPass / total) * 100) : 0;
  const referableRate = total > 0 ? Math.round((referableCount / total) * 100) : 0;

  // Screenings over time (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = screenings.filter((s) => s.screening_date?.startsWith(dateStr)).length;
    return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), count };
  });
  const maxDayCount = Math.max(...last7Days.map((d) => d.count), 1);

  const metrics = [
    { label: 'Total Screenings', value: total, icon: Activity, color: 'text-brand-600', bg: 'bg-brand-100 dark:bg-brand-950' },
    { label: 'Referable Rate', value: `${referableRate}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-950' },
    { label: 'Quality Pass Rate', value: `${passRate}%`, icon: PieChart, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' },
    { label: 'Pending Reviews', value: pendingCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950' },
    { label: 'Avg Processing Time', value: `${avgProcessingTime}ms`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-950' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Analytics</h1>
        <p className="text-sm text-secondary mt-1">Prototype operational metrics and screening insights</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <Card key={i} className="animate-fade-in-up">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl mb-3', m.bg)}>
                <Icon className={cn('h-5 w-5', m.color)} />
              </div>
              {loading ? (
                <div className="skeleton h-8 w-16 rounded" />
              ) : (
                <p className="text-2xl font-bold text-primary tabular-nums">{m.value}</p>
              )}
              <p className="text-xs text-secondary mt-1">{m.label}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DR Grade Distribution */}
        <Card>
          <SectionTitle title="DR Grade Distribution" subtitle="Screenings by predicted grade" icon={<BarChart3 className="h-5 w-5" />} />
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
          ) : (
            <div className="space-y-3">
              {DR_GRADES.map((g, i) => (
                <div key={g.grade}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-primary">{g.label} — {g.severity}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color: g.color }}>
                      {gradeCounts[i]} ({total > 0 ? Math.round((gradeCounts[i] / total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all duration-700 ease-out"
                      style={{
                        width: `${(gradeCounts[i] / maxGradeCount) * 100}%`,
                        backgroundColor: g.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quality Pass/Fail */}
        <Card>
          <SectionTitle title="Image Quality" subtitle="Pass vs. fail rate" icon={<PieChart className="h-5 w-5" />} />
          {loading ? (
            <div className="skeleton h-48 rounded" />
          ) : (
            <div className="flex flex-col items-center">
              {/* Donut chart */}
              <div className="relative w-48 h-48 mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100 dark:text-slate-800" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                    strokeDasharray={`${(passRate / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-primary">{passRate}%</span>
                  <span className="text-xs text-tertiary">Pass Rate</span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm text-secondary">Pass: {qualityPass}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm text-secondary">Fail: {qualityFail}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Screenings Over Time */}
        <Card className="lg:col-span-2">
          <SectionTitle title="Screenings Over Time" subtitle="Last 7 days" icon={<TrendingUp className="h-5 w-5" />} />
          {loading ? (
            <div className="skeleton h-48 rounded" />
          ) : (
            <div className="flex items-end justify-between gap-2 h-48 px-2">
              {last7Days.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg gradient-brand transition-all duration-700 ease-out min-h-[4px]"
                      style={{ height: `${(day.count / maxDayCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-tertiary font-medium">{day.date}</span>
                  <span className="text-xs font-bold text-primary tabular-nums">{day.count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Referral Distribution */}
      <Card>
        <SectionTitle title="Referral Distribution" subtitle="Referable vs. non-referable screenings" icon={<Activity className="h-5 w-5" />} />
        {loading ? (
          <div className="skeleton h-12 rounded" />
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="warning">Potentially Referable</Badge>
                  <span className="text-sm text-secondary">{referableCount} screenings</span>
                </div>
                <span className="text-sm font-bold text-orange-600">{referableRate}%</span>
              </div>
              <div className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-orange-500 rounded-lg transition-all duration-700" style={{ width: `${referableRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Not Referable</Badge>
                  <span className="text-sm text-secondary">{total - referableCount} screenings</span>
                </div>
                <span className="text-sm font-bold text-green-600">{100 - referableRate}%</span>
              </div>
              <div className="h-4 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-green-500 rounded-lg transition-all duration-700" style={{ width: `${100 - referableRate}%` }} />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
