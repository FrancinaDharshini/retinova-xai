import { supabase } from './supabase';
import type { Screening, ReviewStatus, DoctorDecision } from '@/types';

/**
 * Screening database operations.
 * Uses Supabase for persistence. All operations go through RLS policies.
 */

export interface ScreeningRecord {
  id?: string;
  patient_demo_id: string;
  screening_date: string;
  image_quality: string;
  quality_score: number;
  dr_grade: number;
  severity: string;
  confidence: number;
  referable: boolean;
  priority: string;
  review_status: string;
  doctor_decision: string | null;
  doctor_comment: string | null;
  reviewer: string | null;
  reviewed_at: string | null;
  report: unknown;
  image_url: string | null;
  gradcam_url: string | null;
  class_probabilities: unknown;
  model_status: string;
  processing_time_ms: number;
}

export async function saveScreening(record: ScreeningRecord): Promise<Screening | null> {
  const { data, error } = await supabase
    .from('screenings')
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error('Failed to save screening:', error);
    return null;
  }

  return data as unknown as Screening;
}

export async function getScreenings(): Promise<Screening[]> {
  const { data, error } = await supabase
    .from('screenings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch screenings:', error);
    return [];
  }

  return (data ?? []) as unknown as Screening[];
}

export async function getScreeningById(id: string): Promise<Screening | null> {
  const { data, error } = await supabase
    .from('screenings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch screening:', error);
    return null;
  }

  return data as unknown as Screening;
}

export async function updateScreeningReview(
  id: string,
  decision: DoctorDecision,
  comment: string | null,
  reviewer: string,
  reviewStatus: ReviewStatus,
): Promise<Screening | null> {
  const { data, error } = await supabase
    .from('screenings')
    .update({
      doctor_decision: decision,
      doctor_comment: comment,
      reviewer,
      reviewed_at: new Date().toISOString(),
      review_status: reviewStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update review:', error);
    return null;
  }

  return data as unknown as Screening;
}

export async function getDashboardStats(): Promise<{
  total: number;
  today: number;
  referable: number;
  recapture: number;
  pending: number;
}> {
  const { data, error } = await supabase
    .from('screenings')
    .select('referable, image_quality, review_status, screening_date');

  if (error || !data) {
    return { total: 0, today: 0, referable: 0, recapture: 0, pending: 0 };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  return {
    total: data.length,
    today: data.filter((s) => (s as { screening_date: string }).screening_date?.startsWith(todayStr)).length,
    referable: data.filter((s) => (s as { referable: boolean }).referable).length,
    recapture: data.filter((s) => (s as { image_quality: string }).image_quality === 'POOR').length,
    pending: data.filter((s) => (s as { review_status: string }).review_status === 'PENDING').length,
  };
}
