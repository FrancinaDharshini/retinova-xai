import { useEffect, useState } from 'react';
import { FileText, Eye, Download, Stethoscope } from 'lucide-react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { getScreenings } from '@/lib/screeningService';
import { getGradeInfo, formatDateShort } from '@/lib/constants';
import type { Screening, Page } from '@/types';

interface ReportsPageProps {
  onNavigate: (page: Page) => void;
  onViewScreening: (id: string) => void;
}

export function ReportsPage({ onNavigate, onViewScreening }: ReportsPageProps) {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScreenings().then((s) => {
      setScreenings(s);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">Reports</h1>
        <p className="text-sm text-secondary mt-1">AI screening reports generated from model outputs</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : screenings.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-500 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-primary mb-1">No reports yet</h3>
            <p className="text-sm text-secondary mb-4">Complete a screening to generate a report.</p>
            <Button onClick={() => onNavigate('screening')}>
              <Stethoscope className="h-4 w-4" />
              Start New Screening
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {screenings.map((s) => {
            const gradeInfo = getGradeInfo(s.dr_grade);
            const report = s.report;
            return (
              <Card key={s.id} hover className="flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-medium text-primary">{s.patient_demo_id}</span>
                  <Badge variant={s.review_status === 'CONFIRMED' ? 'success' : s.review_status === 'OVERRIDDEN' ? 'warning' : 'neutral'}>
                    {s.review_status}
                  </Badge>
                </div>

                {/* Grade + Severity */}
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-lg"
                    style={{ backgroundColor: gradeInfo.color }}
                  >
                    {s.dr_grade}
                  </div>
                  <div>
                    <p className="font-bold text-primary">{gradeInfo.label}</p>
                    <p className="text-xs text-secondary">{s.severity}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2 rounded-lg bg-hover">
                    <p className="text-tertiary">Confidence</p>
                    <p className="font-semibold text-primary">{s.confidence}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-hover">
                    <p className="text-tertiary">Quality</p>
                    <p className="font-semibold text-primary">{s.image_quality} ({s.quality_score}%)</p>
                  </div>
                  <div className="p-2 rounded-lg bg-hover">
                    <p className="text-tertiary">Priority</p>
                    <p className="font-semibold text-primary">{s.priority}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-hover">
                    <p className="text-tertiary">Date</p>
                    <p className="font-semibold text-primary">{formatDateShort(s.screening_date)}</p>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-secondary leading-relaxed flex-1 line-clamp-3 mb-4">
                  {report?.summary ?? 'No summary available.'}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Button variant="outline" size="sm" fullWidth onClick={() => onViewScreening(s.id)}>
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('screening')}>
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
