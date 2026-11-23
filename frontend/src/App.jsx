import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import GoogleAuthSuccessPage from "@/pages/GoogleAuthSuccessPage";
import DashboardPage from "@/pages/DashboardPage";
import QuizEntryPage from "@/pages/QuizEntryPage";
import MockInstructionsPage from "@/pages/MockInstructionsPage";
import MockExamPage from "@/pages/MockExamPage";
import ResultsPage from "@/pages/ResultsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import AdminPage from "@/pages/AdminPage";
import FeedbackPage from "@/pages/FeedbackPage";
import VerifyOTPPage from "@/pages/VerifyOTPPage";
import PrivacyPolicyPage from "@/pages/PrivacyPolicyPage";
import TermsPage from "@/pages/TermsPage";

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "12px", fontSize: "14px" },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
          <Route
            path="/auth/google/success"
            element={<GoogleAuthSuccessPage />}
          />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/quiz/:quizId" element={<QuizEntryPage />} />
            <Route path="/mock/:quizId" element={<MockInstructionsPage />} />
            <Route path="/mock/attempt/:attemptId" element={<MockExamPage />} />
            <Route path="/results/:attemptId" element={<ResultsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
);

export default App;