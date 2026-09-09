import type { DRGrade, Priority } from '@/types';

export const DR_GRADES: { grade: DRGrade; label: string; severity: string; color: string; bgColor: string; description: string }[] = [
  { grade: 0, label: 'Grade 0', severity: 'No DR', color: '#22c55e', bgColor: '#dcfce7', description: 'No apparent diabetic retinopathy signs detected' },
  { grade: 1, label: 'Grade 1', severity: 'Mild DR', color: '#84cc16', bgColor: '#d9f99d', description: 'Microaneurysms detected — early-stage changes' },
  { grade: 2, label: 'Grade 2', severity: 'Moderate DR', color: '#eab308', bgColor: '#fef08a', description: 'Retinal hemorrhages and hard exudates present' },
  { grade: 3, label: 'Grade 3', severity: 'Severe DR', color: '#f97316', bgColor: '#fed7aa', description: 'Extensive hemorrhages, venous beading, IRMAs' },
  { grade: 4, label: 'Grade 4', severity: 'Proliferative DR', color: '#ef4444', bgColor: '#fee2e2', description: 'Neovascularization and vitreous/preretinal hemorrhage' },
];

export function getGradeInfo(grade: DRGrade) {
  return DR_GRADES.find((g) => g.grade === grade) ?? DR_GRADES[0];
}

export function isReferable(grade: DRGrade): boolean {
  return grade >= 2;
}

export function getPriority(grade: DRGrade, confidence: number): Priority {
  if (grade >= 3) return 'HIGH';
  if (grade === 2) return confidence > 75 ? 'HIGH' : 'MODERATE';
  if (grade === 1) return 'LOW';
  return 'LOW';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function generateDemoPatientId(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `DEMO-${num}`;
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
