import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Import critical pages synchronously
import Index from "../pages/Index";
import NotFound from "../pages/NotFound";
import PatientDashboard from "../pages/PatientDashboard";
import TodaysIpdDashboard from "../pages/TodaysIpdDashboard";
import NoDeductionLetterPage from "../pages/NoDeductionLetter";
import CurrentlyAdmittedPatients from "../pages/CurrentlyAdmittedPatients";

// Lazy load heavy feature pages
const Accounting = lazy(() => import("../pages/Accounting"));
const Pharmacy = lazy(() => import("../pages/Pharmacy"));
const Lab = lazy(() => import("../pages/Lab"));
const Radiology = lazy(() => import("../pages/Radiology"));
const OperationTheatre = lazy(() => import("../pages/OperationTheatre"));
const FinalBill = lazy(() => import("../pages/FinalBill"));
const EditFinalBill = lazy(() => import("../pages/EditFinalBill"));

// Lazy load other pages
const Diagnoses = lazy(() => import("../pages/Diagnoses"));
const Patients = lazy(() => import("../pages/Patients"));
const Users = lazy(() => import("../pages/Users"));
const Complications = lazy(() => import("../pages/Complications"));
const CghsSurgery = lazy(() => import("../pages/CghsSurgery"));
const Medications = lazy(() => import("../pages/Medications"));
const EsicSurgeons = lazy(() => import("../pages/EsicSurgeons"));
const Referees = lazy(() => import("../pages/Referees"));
const HopeSurgeons = lazy(() => import("../pages/HopeSurgeons"));
const HopeConsultants = lazy(() => import("../pages/HopeConsultants"));
const SecurityVerificationPage = lazy(() => import("../pages/SecurityVerificationPage"));
const GatePassPrintPage = lazy(() => import("../pages/GatePassPrint"));
const DischargeSummaryPrint = lazy(() => import("../pages/DischargeSummaryPrint"));
const PVIFormPrint = lazy(() => import("../pages/PVIFormPrint"));
const PatientProfile = lazy(() => import("../pages/PatientProfile"));
const Prescriptions = lazy(() => import("../pages/prescriptions/Prescriptions"));
const TreatmentSheet = lazy(() => import("../pages/TreatmentSheet"));
const Reports = lazy(() => import("../pages/Reports"));
const FinalBillTest = lazy(() => import("../pages/FinalBillTest"));
const LabPrintDemo = lazy(() => import("../pages/LabPrintDemo"));
const StoreRequisition = lazy(() => import("../components/pharmacy/StoreRequisition"));
const DaywiseBills = lazy(() => import("../pages/DaywiseBills"));
const OldBills = lazy(() => import("../pages/OldBills"));
const ViewBill = lazy(() => import("../pages/ViewBill"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/patient-profile" element={<Suspense fallback={<PageLoader />}><PatientProfile /></Suspense>} />
        <Route path="/todays-ipd" element={<TodaysIpdDashboard />} />
        <Route path="/currently-admitted" element={<CurrentlyAdmittedPatients />} />
        <Route path="/security-verification" element={<Suspense fallback={<PageLoader />}><SecurityVerificationPage /></Suspense>} />
        <Route path="/gate-pass/:visitId" element={<Suspense fallback={<PageLoader />}><GatePassPrintPage /></Suspense>} />
        <Route path="/discharge-summary/:visitId" element={<Suspense fallback={<PageLoader />}><DischargeSummaryPrint /></Suspense>} />
        <Route path="/pvi-form/:visitId" element={<Suspense fallback={<PageLoader />}><PVIFormPrint /></Suspense>} />
        <Route path="/diagnoses" element={<Suspense fallback={<PageLoader />}><Diagnoses /></Suspense>} />
        <Route path="/operation-theatre" element={<Suspense fallback={<PageLoader />}><OperationTheatre /></Suspense>} />
        <Route path="/patients" element={<Suspense fallback={<PageLoader />}><Patients /></Suspense>} />
        <Route path="/users" element={<Suspense fallback={<PageLoader />}><Users /></Suspense>} />
        <Route path="/complications" element={<Suspense fallback={<PageLoader />}><Complications /></Suspense>} />
        <Route path="/cghs-surgery" element={<Suspense fallback={<PageLoader />}><CghsSurgery /></Suspense>} />
        <Route path="/lab" element={<Suspense fallback={<PageLoader />}><Lab /></Suspense>} />
        <Route path="/radiology" element={<Suspense fallback={<PageLoader />}><Radiology /></Suspense>} />
        <Route path="/medications" element={<Suspense fallback={<PageLoader />}><Medications /></Suspense>} />
        <Route path="/prescriptions" element={<Suspense fallback={<PageLoader />}><Prescriptions /></Suspense>} />
        <Route path="/treatment-sheet" element={<Suspense fallback={<PageLoader />}><TreatmentSheet /></Suspense>} />
        <Route path="/esic-surgeons" element={<Suspense fallback={<PageLoader />}><EsicSurgeons /></Suspense>} />
        <Route path="/referees" element={<Suspense fallback={<PageLoader />}><Referees /></Suspense>} />
        <Route path="/hope-surgeons" element={<Suspense fallback={<PageLoader />}><HopeSurgeons /></Suspense>} />
        <Route path="/hope-consultants" element={<Suspense fallback={<PageLoader />}><HopeConsultants /></Suspense>} />
        <Route path="/accounting" element={<Suspense fallback={<PageLoader />}><Accounting /></Suspense>} />
        <Route path="/pharmacy/goods-received-note" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/purchase-orders/add" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/purchase-orders/list" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/product-purchase-report" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy/inventory-tracking" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/pharmacy" element={<Suspense fallback={<PageLoader />}><Pharmacy /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageLoader />}><Reports /></Suspense>} />
        <Route path="/final-bill/:visitId" element={<Suspense fallback={<PageLoader />}><FinalBill /></Suspense>} />
        <Route path="/no-deduction-letter/:visitId" element={<NoDeductionLetterPage />} />
        <Route path="/edit-final-bill/:visitId" element={<Suspense fallback={<PageLoader />}><EditFinalBill /></Suspense>} />
        <Route path="/old-bills/:visitId" element={<Suspense fallback={<PageLoader />}><OldBills /></Suspense>} />
        <Route path="/view-bill/:billId" element={<Suspense fallback={<PageLoader />}><ViewBill /></Suspense>} />
        <Route path="/lab-print-demo" element={<Suspense fallback={<PageLoader />}><LabPrintDemo /></Suspense>} />
        <Route path="/daywise-bills" element={<Suspense fallback={<PageLoader />}><DaywiseBills /></Suspense>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
