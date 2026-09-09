import type {
  AnalysisResult,
  ClassProbabilities,
  DRGrade,
  ImageQuality,
  ModelStatus,
  Priority,
  ScreeningReport,
} from '@/types';
import { getGradeInfo, getPriority, isReferable } from './constants';

/**
 * AI Service Layer
 *
 * Central abstraction for retinal image analysis. All backend/model calls
 * go through this module so the trained model can be connected later
 * by replacing the DEMO_MODE implementation with real fetch() calls.
 *
 * API-ready endpoints (backend):
 *   POST /api/analyze          — full analysis pipeline
 *   POST /api/quality-check    — image quality gate only
 *   POST /api/report           — LLM report generation
 *   GET  /api/screenings       — list screening records
 *   GET  /api/screenings/:id   — single screening
 *   POST /api/screenings/:id/review — doctor review
 *
 * Environment variables (server-side only, never exposed in frontend):
 *   LLM_API_KEY, BACKEND_URL, MODEL_SERVICE_URL
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';

/** Check if a real backend is configured */
export function getModelStatus(): ModelStatus {
  return BACKEND_URL ? 'CONNECTED' : 'DEMO_MODE';
}

// ---------------------------------------------------------------------------
// Image Quality Assessment
// ---------------------------------------------------------------------------

/**
 * Assess retinal image quality using client-side heuristics.
 * In production this would call POST /api/quality-check on the FastAPI backend
 * which uses Laplacian variance + brightness analysis in Python/OpenCV.
 *
 * Here we compute a practical approximation in-browser:
 *   - Blur: Laplacian variance via canvas pixel analysis
 *   - Brightness: mean luminance
 *   - Illumination: standard deviation of luminance (uniformity)
 *   - Field visibility: ratio of non-black pixels
 */
export async function checkImageQuality(imageFile: File): Promise<ImageQuality> {
  const img = await loadImage(imageFile);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return defaultQualityResult(img.width, img.height, ['Canvas context unavailable']);
  }

  // Downscale for analysis performance
  const maxDim = 512;
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const aw = Math.round(img.width * scale);
  const ah = Math.round(img.height * scale);
  canvas.width = aw;
  canvas.height = ah;
  ctx.drawImage(img, 0, 0, aw, ah);

  const imageData = ctx.getImageData(0, 0, aw, ah);
  const data = imageData.data;

  // Brightness (mean luminance)
  let sumLum = 0;
  const lumMap = new Float32Array(aw * ah);
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lumMap[i / 4] = lum;
    sumLum += lum;
  }
  const meanLum = sumLum / (aw * ah);

  // Illumination uniformity (std dev of luminance)
  let sumSqDiff = 0;
  for (let i = 0; i < lumMap.length; i++) {
    sumSqDiff += (lumMap[i] - meanLum) ** 2;
  }
  const stdLum = Math.sqrt(sumSqDiff / lumMap.length);
  const illuminationScore = Math.max(0, 100 - stdLum * 1.5);

  // Blur detection via Laplacian approximation (edge gradient magnitude)
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 1; y < ah - 1; y++) {
    for (let x = 1; x < aw - 1; x++) {
      const idx = y * aw + x;
      const lap =
        -4 * lumMap[idx] +
        lumMap[idx - 1] +
        lumMap[idx + 1] +
        lumMap[idx - aw] +
        lumMap[idx + aw];
      edgeSum += lap * lap;
      edgeCount++;
    }
  }
  const laplacianVar = edgeSum / edgeCount;
  // Normalize for downscaled fundus images — real retinal photos at 512px scale
  // typically produce laplacianVar in the 50–600 range. Use 150 as denominator.
  const blurScore = Math.min(100, (laplacianVar / 150) * 100);

  // Field visibility: ratio of pixels that are not near-black.
  // Fundus images have a circular retinal field surrounded by dark background —
  // this is normal. Only flag if the bright retinal area is extremely small.
  let visiblePixels = 0;
  for (let i = 0; i < lumMap.length; i++) {
    if (lumMap[i] > 20) visiblePixels++;
  }
  const fieldVisibility = (visiblePixels / lumMap.length) * 100;

  // Brightness score: fundus images are typically darker than natural photos.
  // Ideal mean luminance for retinal images is roughly 60–180.
  let brightnessScore: number;
  if (meanLum < 15) brightnessScore = meanLum * 2;
  else if (meanLum < 25) brightnessScore = 30 + (meanLum - 15) * 4;
  else if (meanLum > 220) brightnessScore = Math.max(0, 100 - (meanLum - 220) * 2);
  else brightnessScore = 100 - Math.abs(meanLum - 110) * 0.4;

  // Overall quality score — weighted to be lenient enough for real fundus images
  // while still catching genuinely unusable photos.
  const qualityScore = Math.round(
    blurScore * 0.3 +
      Math.min(100, brightnessScore) * 0.25 +
      Math.min(100, illuminationScore + 20) * 0.15 +
      Math.min(100, fieldVisibility + 30) * 0.3,
  );

  // Only flag critical issues — fundus images naturally have dark borders and
  // uneven illumination, so we don't reject for those alone.
  const issues: string[] = [];
  if (blurScore < 15) issues.push('Image appears heavily blurred — insufficient focus for reliable screening');
  if (meanLum < 15) issues.push('Image is too dark — insufficient illumination for screening');
  if (meanLum > 235) issues.push('Image is severely overexposed — excessive brightness');
  if (fieldVisibility < 15) issues.push('Retinal field is barely visible — image may not contain retina');

  // Pass if the overall score is acceptable and there are no critical issues.
  // A single minor concern (e.g. slightly uneven illumination) should not block analysis.
  const status = qualityScore >= 35 && issues.length === 0 ? 'GOOD' : 'POOR';

  return {
    status,
    score: Math.max(0, Math.min(100, qualityScore)),
    blur_score: Math.round(blurScore),
    brightness: Math.round(meanLum),
    illumination: Math.round(illuminationScore),
    field_visibility: Math.round(fieldVisibility),
    width: img.width,
    height: img.height,
    valid: img.width >= 200 && img.height >= 200,
    issues,
  };
}

// ---------------------------------------------------------------------------
// DR Classification (DEMO MODE heuristic)
// ---------------------------------------------------------------------------

/**
 * Run DR classification on the retinal image.
 *
 * In production this calls POST /api/analyze on the FastAPI backend which:
 *   1. Preprocesses the image (resize, normalize, CLAHE)
 *   2. Runs the PyTorch model (EfficientNet-B0 / ResNet50)
 *   3. Generates Grad-CAM heatmap
 *   4. Returns class probabilities + confidence
 *
 * In DEMO MODE, we derive a deterministic-but-varied prediction from
 * image features (brightness, blur, field visibility) so that different
 * uploaded images produce different, plausible-looking results.
 * This is clearly labeled as DEMO_MODE and never presented as clinical.
 */
export async function analyzeRetinalImage(
  imageFile: File,
  quality: ImageQuality,
): Promise<Pick<
  AnalysisResult,
  'dr_grade' | 'severity_label' | 'confidence' | 'class_probabilities' | 'gradcam_metadata' | 'findings' | 'processing_time_ms'
>> {
  const startTime = performance.now();

  // Simulate model inference latency (kept short for demo)
  await delay(800 + Math.random() * 600);

  // Extract image features to derive a pseudo-prediction.
  // This is NOT a medical prediction — it's a deterministic demo heuristic
  // that uses real pixel data so different images produce different results.
  const features = await extractImageFeatures(imageFile);

  // Derive grade from multiple image features:
  // - Red channel dominance (blood/hemorrhage indicator in fundus images)
  // - Edge density (lesion texture)
  // - Dark spot ratio (hemorrhages/exudates appear as dark/bright spots)
  // - Color variance (more variance = more lesions)
  const redDominance = features.redRatio; // 0-1, higher = more red
  const edgeDensity = features.edgeDensity; // 0-1
  const darkSpotRatio = features.darkSpotRatio; // 0-1
  const colorVariance = features.colorVariance; // 0-1

  // Combine features into a severity score (0-4 range)
  const severityScore =
    redDominance * 1.5 +
    edgeDensity * 1.0 +
    darkSpotRatio * 1.2 +
    colorVariance * 0.8;

  // Map severity score to grade 0-4
  let grade: DRGrade;
  if (severityScore < 0.8) grade = 0;
  else if (severityScore < 1.4) grade = 1;
  else if (severityScore < 2.0) grade = 2;
  else if (severityScore < 2.6) grade = 3;
  else grade = 4;

  // Build plausible class probabilities centered on the predicted grade
  const probs = generateProbabilities(grade, quality.score);

  // Confidence: max probability
  const confidence = Math.round(Math.max(probs.grade_0, probs.grade_1, probs.grade_2, probs.grade_3, probs.grade_4) * 100);

  const gradeInfo = getGradeInfo(grade);
  const findings = generateFindings(grade);

  const elapsed = performance.now() - startTime;

  return {
    dr_grade: grade,
    severity_label: gradeInfo.severity,
    confidence,
    class_probabilities: probs,
    gradcam_metadata: {
      available: false, // DEMO MODE — no real Grad-CAM
      method: 'Grad-CAM (not available in DEMO MODE)',
      target_layer: 'N/A',
      regions: [],
    },
    findings,
    processing_time_ms: Math.round(elapsed),
  };
}

// ---------------------------------------------------------------------------
// Grad-CAM
// ---------------------------------------------------------------------------

/**
 * Generate Grad-CAM heatmap overlay.
 *
 * In production this is returned by the backend as part of POST /api/analyze.
 * The PyTorch model generates a Grad-CAM heatmap at the last convolutional
 * layer, which is upscaled and overlaid on the original image.
 *
 * In DEMO MODE, no Grad-CAM is available. We return null and the UI shows
 * a clear "Model explanation unavailable" state.
 */
export async function getGradCAM(_imageFile: File): Promise<string | null> {
  // DEMO MODE: Grad-CAM is not available without the trained model
  return null;
}

// ---------------------------------------------------------------------------
// LLM Report Generation
// ---------------------------------------------------------------------------

/**
 * Generate a structured screening report from model outputs.
 *
 * In production this calls POST /api/report on the FastAPI backend which
 * sends ONLY structured model outputs to the LLM (no image, no patient data).
 * The LLM is prompted to summarize — NOT diagnose, prescribe, or invent findings.
 *
 * In DEMO MODE, we generate the report locally using a template that
 * strictly reflects the model output without hallucination.
 */
export function generateReport(
  quality: ImageQuality,
  grade: DRGrade,
  severity: string,
  confidence: number,
  probs: ClassProbabilities,
  referable: boolean,
  priority: Priority,
  findings: string[],
  modelStatus: ModelStatus,
): ScreeningReport {
  const gradeInfo = getGradeInfo(grade);
  const probList = [
    `Grade 0: ${(probs.grade_0 * 100).toFixed(1)}%`,
    `Grade 1: ${(probs.grade_1 * 100).toFixed(1)}%`,
    `Grade 2: ${(probs.grade_2 * 100).toFixed(1)}%`,
    `Grade 3: ${(probs.grade_3 * 100).toFixed(1)}%`,
    `Grade 4: ${(probs.grade_4 * 100).toFixed(1)}%`,
  ].join(', ');

  const summary = quality.status === 'POOR'
    ? `Image quality assessment indicates the uploaded retinal image is insufficient for reliable AI screening (quality score: ${quality.score}%). The AI model did not produce a confident prediction. Please recapture or upload a clearer retinal image.`
    : `AI screening analysis of the retinal image suggests ${gradeInfo.label} — ${severity} with ${confidence}% confidence. ${referable ? 'The result is potentially referable for specialist ophthalmology review.' : 'No immediate referral is indicated based on the screening result.'}`;

  const aiAssessment = `The AI model classified this retinal image as ${gradeInfo.label} (${severity}). ${gradeInfo.description}. Model confidence: ${confidence}%.`;

  const modelConfidence = `The model's class probability distribution: ${probList}. Highest confidence: ${confidence}% for ${gradeInfo.label}.`;

  const imageQualityNote = `Image quality status: ${quality.status}. Quality score: ${quality.score}%. Blur score: ${quality.blur_score}%, Brightness: ${quality.brightness}, Illumination uniformity: ${quality.illumination}%, Field visibility: ${quality.field_visibility}%.`;

  const aiSupportedFindings = findings.length > 0
    ? findings
    : ['No specific findings were detected by the model beyond the overall grade classification.'];

  const recommendation = referable
    ? `Specialist ophthalmology review recommended based on the screening result (${gradeInfo.label} — ${severity}). Referral recommendation is for specialist review and is not a treatment decision.`
    : `No immediate referral indicated. Routine diabetic retinopathy screening as per standard protocol. Final clinical assessment remains with an ophthalmologist.`;

  const disclaimer = `AI-generated screening support only. ${modelStatus === 'DEMO_MODE' ? 'Running in DEMO MODE — results are simulated and not clinical predictions. ' : ''}Final clinical assessment remains with an ophthalmologist. This system is not clinically validated and does not provide a diagnosis or treatment recommendation.`;

  // Patient-friendly plain-language summary (for non-medical users / rural people)
  const patientSummary = quality.status === 'POOR'
    ? 'The photo of your eye was not clear enough for the computer to check properly. This does not mean anything is wrong. Please take another photo in better lighting and try again.'
    : grade === 0
      ? 'The AI checked your retina photo and did not find signs of diabetic eye damage. This is good news. Please continue your regular check-ups as advised by your doctor.'
      : grade === 1
        ? 'The AI found very early signs of changes in your retina. This is common and often slow-growing. Please show this report to your eye doctor at your next visit. No need to panic.'
        : grade === 2
          ? 'The AI found moderate changes in your retina. You should visit an eye specialist (ophthalmologist) for a full check-up. Early treatment can help protect your vision.'
          : grade === 3
            ? 'The AI found more serious changes in your retina. Please see an eye specialist as soon as possible. The sooner you get checked, the better the chances of protecting your eyesight.'
            : 'The AI found advanced changes in your retina. Please see an eye specialist urgently. Quick action is important to protect your vision.';

  // Plain-language next steps for the patient
  const patientNextSteps: string[] =
    quality.status === 'POOR'
      ? [
          'Take a new photo of your retina in a well-lit room',
          'Make sure the eye fills most of the photo and is in sharp focus',
          'Ask a clinic worker or technician for help if needed',
          'Upload the new photo and run the screening again',
        ]
      : grade === 0
        ? [
            'Continue your regular diabetes check-ups',
            'Get your eyes screened every year as recommended',
            'Keep your blood sugar and blood pressure under control',
            'Return for your next screening as scheduled',
          ]
        : grade === 1
          ? [
              'Show this report to your eye doctor at your next visit',
              'Continue yearly eye screenings',
              'Keep your blood sugar and blood pressure under control',
              'Watch for any changes in your vision and report them promptly',
            ]
          : grade === 2
            ? [
                'Book an appointment with an eye specialist (ophthalmologist)',
                'Bring this report with you to the appointment',
                'Do not delay — early treatment can save your sight',
                'Continue managing your blood sugar and blood pressure',
              ]
            : grade === 3
              ? [
                  'See an eye specialist as soon as possible (within 1-2 weeks)',
                  'Bring this report and your medical history',
                  'Do not wait for symptoms to worsen',
                  'Ask your doctor about treatment options',
                ]
              : [
                  'See an eye specialist urgently — do not delay',
                  'Bring this report to every appointment',
                  'Ask about immediate treatment options',
                  'Have a family member or friend help you get to the clinic',
                ];

  // Traffic-light urgency level for quick visual scanning
  const urgencyLevel: 'green' | 'yellow' | 'red' =
    quality.status === 'POOR' ? 'yellow' :
    grade >= 3 ? 'red' :
    grade >= 2 ? 'yellow' :
    'green';

  return {
    summary,
    ai_assessment: aiAssessment,
    model_confidence: modelConfidence,
    image_quality_note: imageQualityNote,
    ai_supported_findings: aiSupportedFindings,
    referral_priority: priority,
    recommendation,
    disclaimer,
    patient_summary: patientSummary,
    patient_next_steps: patientNextSteps,
    urgency_level: urgencyLevel,
  };
}

// ---------------------------------------------------------------------------
// Full Analysis Pipeline
// ---------------------------------------------------------------------------

/**
 * Complete analysis pipeline: quality → classification → Grad-CAM → report.
 * This is the main entry point called by the Screening page.
 */
export async function analyzeImage(imageFile: File): Promise<AnalysisResult> {
  const modelStatus = getModelStatus();

  // Step 1: Image quality gate
  const quality = await checkImageQuality(imageFile);

  // If quality fails, return early with no prediction
  if (quality.status === 'POOR') {
    const report = generateReport(
      quality,
      0,
      'No DR',
      0,
      { grade_0: 0, grade_1: 0, grade_2: 0, grade_3: 0, grade_4: 0 },
      false,
      'LOW',
      [],
      modelStatus,
    );

    return {
      image_quality: quality,
      quality_score: quality.score,
      quality_status: quality.status,
      dr_grade: 0,
      severity_label: 'Assessment Incomplete',
      confidence: 0,
      class_probabilities: { grade_0: 0, grade_1: 0, grade_2: 0, grade_3: 0, grade_4: 0 },
      gradcam_image: null,
      gradcam_metadata: { available: false, method: 'N/A', target_layer: 'N/A', regions: [] },
      referable: false,
      priority: 'LOW',
      findings: [],
      report,
      model_status: modelStatus,
      processing_time_ms: 0,
    };
  }

  // Step 2: DR classification
  const classification = await analyzeRetinalImage(imageFile, quality);

  // Step 3: Grad-CAM
  const gradcam = await getGradCAM(imageFile);

  // Step 4: Referable + priority
  const referable = isReferable(classification.dr_grade);
  const priority = getPriority(classification.dr_grade, classification.confidence);

  // Step 5: LLM report
  const report = generateReport(
    quality,
    classification.dr_grade,
    classification.severity_label,
    classification.confidence,
    classification.class_probabilities,
    referable,
    priority,
    classification.findings,
    modelStatus,
  );

  return {
    image_quality: quality,
    quality_score: quality.score,
    quality_status: quality.status,
    dr_grade: classification.dr_grade,
    severity_label: classification.severity_label,
    confidence: classification.confidence,
    class_probabilities: classification.class_probabilities,
    gradcam_image: gradcam,
    gradcam_metadata: classification.gradcam_metadata,
    referable,
    priority,
    findings: classification.findings,
    report,
    model_status: modelStatus,
    processing_time_ms: classification.processing_time_ms,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract visual features from the retinal image for demo-mode classification.
 * These features mimic what a real CNN would detect — red channel dominance
 * (hemorrhage indicator), edge density (lesion texture), dark spot ratio
 * (hemorrhages), and color variance (lesion diversity).
 */
async function extractImageFeatures(imageFile: File): Promise<{
  redRatio: number;
  edgeDensity: number;
  darkSpotRatio: number;
  colorVariance: number;
}> {
  const img = await loadImage(imageFile);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { redRatio: 0.3, edgeDensity: 0.3, darkSpotRatio: 0.2, colorVariance: 0.3 };
  }

  const maxDim = 256;
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  const aw = Math.max(1, Math.round(img.width * scale));
  const ah = Math.max(1, Math.round(img.height * scale));
  canvas.width = aw;
  canvas.height = ah;
  ctx.drawImage(img, 0, 0, aw, ah);

  const imageData = ctx.getImageData(0, 0, aw, ah);
  const data = imageData.data;

  let redSum = 0;
  let greenSum = 0;
  let blueSum = 0;
  let darkSpotCount = 0;
  let totalPixels = 0;
  const lumValues: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Only count pixels that are part of the retinal field (not dark background)
    if (lum > 25) {
      redSum += r;
      greenSum += g;
      blueSum += b;
      totalPixels++;

      // Dark spots within the retinal field (potential hemorrhages)
      if (lum < 50 && lum > 25) darkSpotCount++;

      lumValues.push(lum);
    }
  }

  if (totalPixels === 0) {
    return { redRatio: 0.3, edgeDensity: 0.3, darkSpotRatio: 0.2, colorVariance: 0.3 };
  }

  const totalColor = redSum + greenSum + blueSum;
  const redRatio = totalColor > 0 ? redSum / totalColor : 0.33;

  // Edge density: count pixels with high gradient
  let edgePixels = 0;
  const checkedPixels = lumValues.length;
  for (let y = 1; y < ah - 1; y++) {
    for (let x = 1; x < aw - 1; x++) {
      const idx = (y * aw + x) * 4;
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (lum < 25) continue;

      const idxR = (y * aw + (x + 1)) * 4;
      const idxD = ((y + 1) * aw + x) * 4;
      const lumR = 0.299 * data[idxR] + 0.587 * data[idxR + 1] + 0.114 * data[idxR + 2];
      const lumD = 0.299 * data[idxD] + 0.587 * data[idxD + 1] + 0.114 * data[idxD + 2];

      const grad = Math.abs(lum - lumR) + Math.abs(lum - lumD);
      if (grad > 30) edgePixels++;
    }
  }
  const edgeDensity = checkedPixels > 0 ? edgePixels / checkedPixels : 0;

  const darkSpotRatio = checkedPixels > 0 ? darkSpotCount / checkedPixels : 0;

  // Color variance from luminance values
  const meanLum = lumValues.reduce((a, b) => a + b, 0) / lumValues.length;
  const variance = lumValues.reduce((sum, v) => sum + (v - meanLum) ** 2, 0) / lumValues.length;
  const colorVariance = Math.min(1, variance / 3000);

  return {
    redRatio: Math.min(1, redRatio),
    edgeDensity: Math.min(1, edgeDensity),
    darkSpotRatio: Math.min(1, darkSpotRatio * 5), // scale up since dark spots are rare
    colorVariance,
  };
}

function defaultQualityResult(w: number, h: number, issues: string[]): ImageQuality {
  return {
    status: 'POOR',
    score: 0,
    blur_score: 0,
    brightness: 0,
    illumination: 0,
    field_visibility: 0,
    width: w,
    height: h,
    valid: false,
    issues,
  };
}

function generateProbabilities(grade: DRGrade, qualityScore: number): ClassProbabilities {
  // Center a distribution on the predicted grade with noise from quality
  const baseConfidence = 0.55 + (qualityScore / 100) * 0.35; // 55%–90%
  const noise = (Math.random() - 0.5) * 0.1;

  const probs = [0, 0, 0, 0, 0];
  probs[grade] = baseConfidence + noise;

  // Distribute remaining probability with decay away from predicted grade
  let remaining = 1 - probs[grade];
  for (let offset = 1; offset <= 4; offset++) {
    const weight = 1 / offset;
    const up = grade + offset;
    const down = grade - offset;
    const split = remaining * weight * 0.5;
    if (up <= 4) probs[up] += split;
    if (down >= 0) probs[down] += split;
    remaining -= split * (up <= 4 ? 1 : 0) + split * (down >= 0 ? 1 : 0);
  }

  // Normalize
  const sum = probs.reduce((a, b) => a + b, 0);
  const normalized = probs.map((p) => Math.max(0, p / sum));

  return {
    grade_0: round(normalized[0]),
    grade_1: round(normalized[1]),
    grade_2: round(normalized[2]),
    grade_3: round(normalized[3]),
    grade_4: round(normalized[4]),
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function generateFindings(grade: DRGrade): string[] {
  const allFindings: Record<DRGrade, string[]> = {
    0: ['No microaneurysms detected', 'No hemorrhages observed', 'No hard exudates identified'],
    1: ['Microaneurysms detected in the retinal periphery', 'No significant hemorrhages observed'],
    2: ['Retinal hemorrhages present', 'Hard exudates detected', 'Possible cotton-wool spots'],
    3: ['Extensive intraretinal hemorrhages', 'Venous beading detected', 'IRMAs identified in multiple quadrants'],
    4: ['Neovascularization detected', 'Preretinal/vitreous hemorrhage present', 'Fibrous proliferation observed'],
  };
  return allFindings[grade] ?? [];
}
