export type Theme = 'light' | 'dark';

export type Page =
  | 'landing'
  | 'dashboard'
  | 'screening'
  | 'patients'
  | 'reports'
  | 'analytics'
  | 'model-status'
  | 'settings';

export type DRGrade = 0 | 1 | 2 | 3 | 4;

export type QualityStatus = 'GOOD' | 'POOR';

export type ModelStatus = 'CONNECTED' | 'DEMO_MODE';

export type Priority = 'LOW' | 'MODERATE' | 'HIGH';

export type ReviewStatus = 'PENDING' | 'CONFIRMED' | 'OVERRIDDEN';

export type DoctorDecision = 'CONFIRM' | 'OVERRIDE' | null;

export interface ImageQuality {
  status: QualityStatus;
  score: number;
  blur_score: number;
  brightness: number;
  illumination: number;
  field_visibility: number;
  width: number;
  height: number;
  valid: boolean;
  issues: string[];
}

export interface ClassProbabilities {
  grade_0: number;
  grade_1: number;
  grade_2: number;
  grade_3: number;
  grade_4: number;
}

export interface GradCAMMetadata {
  available: boolean;
  method: string;
  target_layer: string;
  regions: string[];
}

export interface AnalysisResult {
  image_quality: ImageQuality;
  quality_score: number;
  quality_status: QualityStatus;
  dr_grade: DRGrade;
  severity_label: string;
  confidence: number;
  class_probabilities: ClassProbabilities;
  gradcam_image: string | null;
  gradcam_metadata: GradCAMMetadata;
  referable: boolean;
  priority: Priority;
  findings: string[];
  report: ScreeningReport;
  model_status: ModelStatus;
  processing_time_ms: number;
}

export interface ScreeningReport {
  summary: string;
  ai_assessment: string;
  model_confidence: string;
  image_quality_note: string;
  ai_supported_findings: string[];
  referral_priority: Priority;
  recommendation: string;
  disclaimer: string;
  patient_summary: string;
  patient_next_steps: string[];
  urgency_level: 'green' | 'yellow' | 'red';
}

export interface Screening {
  id: string;
  patient_demo_id: string;
  screening_date: string;
  image_quality: QualityStatus;
  quality_score: number;
  dr_grade: DRGrade;
  severity: string;
  confidence: number;
  referable: boolean;
  priority: Priority;
  review_status: ReviewStatus;
  doctor_decision: DoctorDecision;
  doctor_comment: string | null;
  reviewer: string | null;
  reviewed_at: string | null;
  report: ScreeningReport;
  image_url: string | null;
  gradcam_url: string | null;
  class_probabilities: ClassProbabilities;
  model_status: ModelStatus;
  processing_time_ms: number;
  created_at: string;
  updated_at: string;
}

export interface ProcessingStep {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}
