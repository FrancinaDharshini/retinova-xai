import { useEffect, useState } from 'react';
import { Users, Eye, FileText, Stethoscope } from 'lucide-react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getScreenings } from '@/lib/screeningService';
import { getGradeInfo, formatDateShort, cn } from '@/lib/constants';
import type { Screening, Page } from '@/types';

interface PatientsPageProps {
  onNavigate: (page: Page) => void;
  onViewScreening: (id: string) => void;
}

export function PatientsPage({ onNavigate, onViewScreening }: PatientsPageProps) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);

  useEffect(() => {
    getScreenings().then((s) => {
      setScreenings(s);
      setLoading(false);
    });
  }, []);

  const filtered = screenings.filter((s) => {
    if (search && !s.patient_demo_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (gradeFilter !== null && s.dr_grade !== gradeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Patients</h1>
          <p className="text-sm text-secondary mt-1">Screening records with synthetic demo patient IDs</p>
        </div>
        <Button onClick={() => onNavigate('screening')}>
          <Stethoscope className="h-4 w-4" />
          New Screening
        </Button>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-start gap-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
        <Users className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-400">
          Prototype environment. Synthetic patient IDs only — no real personal data stored. Production deployment requires appropriate authentication, encryption, access control, audit logging and applicable healthcare/data-protection compliance.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by Patient ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-xl border border-card bg-bg-secondary px-4 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
          <div className="flex gap-2 flex-wrap">
            <FilterButton label="All" active={gradeFilter === null} onClick={() => setGradeFilter(null)} />
            {[0, 1, 2, 3, 4].map((g) => (
              <FilterButton
                key={g}
                label={`G${g}`}
                active={gradeFilter === g}
                onClick={() => setGradeFilter(g)}
                color={getGradeInfo(g as 0).color}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <SectionTitle title="Screening Records" subtitle={`${filtered.length} record(s)`} icon={<FileText className="h-5 w-5" />} />

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-500 mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-primary mb-1">No records found</h3>
            <p className="text-sm text-secondary mb-4">Start a new screening to create records.</p>
            <Button onClick={() => onNavigate('screening')}>Start New Screening</Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-tertiary uppercase tracking-wider border-b border-card">
                  <th className="pb-3 pr-4 font-semibold">Patient ID</th>
                  <th className="pb-3 pr-4 font-semibold">Date</th>
                  <th className="pb-3 pr-4 font-semibold">Quality</th>
                  <th className="pb-3 pr-4 font-semibold">DR Grade</th>
                  <th className="pb-3 pr-4 font-semibold">Severity</th>
                  <th className="pb-3 pr-4 font-semibold">Confidence</th>
                  <th className="pb-3 pr-4 font-semibold">Priority</th>
                  <th className="pb-3 pr-4 font-semibold">Review</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card">
                {filtered.map((s) => {
                  const gradeInfo = getGradeInfo(s.dr_grade);
                  return (
                    <tr key={s.id} className="hover:bg-hover transition-colors">
                      <td className="py-3 pr-4 font-mono text-xs text-primary font-medium">{s.patient_demo_id}</td>
                      <td className="py-3 pr-4 text-secondary">{formatDateShort(s.screening_date)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={s.image_quality === 'GOOD' ? 'success' : 'danger'}>{s.image_quality}</Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold" style={{ color: gradeInfo.color }}>{gradeInfo.label}</span>
                      </td>
                      <td className="py-3 pr-4 text-secondary">{s.severity}</td>
                      <td className="py-3 pr-4 text-secondary tabular-nums">{s.confidence}%</td>
                      <td className="py-3 pr-4">
                        <Badge variant={s.priority === 'HIGH' ? 'danger' : s.priority === 'MODERATE' ? 'warning' : 'success'}>
                          {s.priority}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {s.review_status === 'CONFIRMED' ? (
                          <Badge variant="success">Confirmed</Badge>
                        ) : s.review_status === 'OVERRIDDEN' ? (
                          <Badge variant="warning">Overridden</Badge>
                        ) : (
                          <Badge variant="neutral">Pending</Badge>
                        )}
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

function FilterButton({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg text-xs font-medium transition-colors',
        active ? 'text-white' : 'bg-hover text-secondary hover:text-primary',
      )}
      style={active ? { backgroundColor: color ?? '#0891b2' } : undefined}
    >
      {label}
    </button>
  );
}
