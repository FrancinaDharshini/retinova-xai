import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/pages/LandingPage';
import { Dashboard } from '@/pages/Dashboard';
import { ScreeningPage } from '@/pages/ScreeningPage';
import { ResultPage } from '@/pages/ResultPage';
import { ReportPage } from '@/pages/ReportPage';
import { DoctorReviewPage } from '@/pages/DoctorReviewPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { ModelStatusPage } from '@/pages/ModelStatusPage';
import { PatientsPage } from '@/pages/PatientsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { getScreeningById } from '@/lib/screeningService';
import type { AnalysisResult, Page, Screening } from '@/types';

type View = 'landing' | 'app' | 'result' | 'report' | 'doctor-review';

function AppContent() {
  const [view, setView] = useState<View>('landing');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [screeningId, setScreeningId] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [viewedScreening, setViewedScreening] = useState<Screening | null>(null);

  // When viewing an existing screening from the dashboard/patients list
  async function handleViewScreening(id: string) {
    const screening = await getScreeningById(id);
    if (screening) {
      setViewedScreening(screening);
      setScreeningId(id);
      setPatientId(screening.patient_demo_id);
      if (screening.image_url) {
        setImageDataUrl(screening.image_url);
      }
      // Convert the stored screening back to AnalysisResult for the result/report/review pages
      const result: AnalysisResult = {
        image_quality: {
          status: screening.image_quality,
          score: screening.quality_score,
          blur_score: 0,
          brightness: 0,
          illumination: 0,
          field_visibility: 0,
          width: 0,
          height: 0,
          valid: true,
          issues: [],
        },
        quality_score: screening.quality_score,
        quality_status: screening.image_quality,
        dr_grade: screening.dr_grade as 0 | 1 | 2 | 3 | 4,
        severity_label: screening.severity,
        confidence: screening.confidence,
        class_probabilities: screening.class_probabilities,
        gradcam_image: screening.gradcam_url,
        gradcam_metadata: {
          available: !!screening.gradcam_url,
          method: screening.gradcam_url ? 'Grad-CAM' : 'N/A',
          target_layer: 'N/A',
          regions: [],
        },
        referable: screening.referable,
        priority: screening.priority as 'LOW' | 'MODERATE' | 'HIGH',
        findings: screening.report?.ai_supported_findings ?? [],
        report: screening.report,
        model_status: screening.model_status as 'CONNECTED' | 'DEMO_MODE',
        processing_time_ms: screening.processing_time_ms,
      };
      setAnalysisResult(result);
      setView('result');
    }
  }

  function handleAnalysisComplete(result: AnalysisResult, imgDataUrl: string, sId: string, pId: string) {
    setAnalysisResult(result);
    setImageDataUrl(imgDataUrl);
    setScreeningId(sId);
    setPatientId(pId);
    setView('result');
  }

  function handleNavigate(page: Page) {
    setCurrentPage(page);
    setView('app');
  }

  // Landing page
  if (view === 'landing') {
    return <LandingPage onEnter={() => { setCurrentPage('dashboard'); setView('app'); }} />;
  }

  // Result page (after analysis or viewing a screening)
  if (view === 'result' && analysisResult) {
    return (
      <Layout currentPage="screening" onNavigate={handleNavigate}>
        <ResultPage
          result={analysisResult}
          imageDataUrl={imageDataUrl}
          screeningId={screeningId}
          onNavigate={handleNavigate}
          onViewReport={() => setView('report')}
          onDoctorReview={() => setView('doctor-review')}
        />
      </Layout>
    );
  }

  // Report page
  if (view === 'report' && analysisResult) {
    return (
      <Layout currentPage="reports" onNavigate={handleNavigate}>
        <ReportPage
          result={analysisResult}
          imageDataUrl={imageDataUrl}
          patientId={patientId || viewedScreening?.patient_demo_id || 'DEMO-0000'}
          screeningId={screeningId}
          onNavigate={handleNavigate}
          onDoctorReview={() => setView('doctor-review')}
        />
      </Layout>
    );
  }

  // Doctor review page
  if (view === 'doctor-review' && analysisResult) {
    return (
      <Layout currentPage="screening" onNavigate={handleNavigate}>
        <DoctorReviewPage
          result={analysisResult}
          imageDataUrl={imageDataUrl}
          patientId={patientId || viewedScreening?.patient_demo_id || 'DEMO-0000'}
          screeningId={screeningId}
          onNavigate={handleNavigate}
          onReviewComplete={() => { setView('app'); setCurrentPage('dashboard'); }}
        />
      </Layout>
    );
  }

  // Main app pages
  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {currentPage === 'dashboard' && (
        <Dashboard onNavigate={handleNavigate} onViewScreening={handleViewScreening} />
      )}
      {currentPage === 'screening' && (
        <ScreeningPage onAnalysisComplete={handleAnalysisComplete} onNavigate={handleNavigate} />
      )}
      {currentPage === 'patients' && (
        <PatientsPage onNavigate={handleNavigate} onViewScreening={handleViewScreening} />
      )}
      {currentPage === 'reports' && (
        <ReportsPage onNavigate={handleNavigate} onViewScreening={handleViewScreening} />
      )}
      {currentPage === 'analytics' && <AnalyticsPage />}
      {currentPage === 'model-status' && <ModelStatusPage />}
      {currentPage === 'settings' && <SettingsPage />}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
