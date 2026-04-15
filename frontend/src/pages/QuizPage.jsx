import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  LayoutGrid,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/axios";
import Navbar from "@/components/common/Navbar";
import Loader from "@/components/common/Loader";
import Button from "@/components/common/Button";
import QuestionCard from "@/components/quiz/QuestionCard";
import QuestionPalette from "@/components/quiz/QuestionPalette";

// ── Resume Modal ───────────────────────────────────────────────────────────
const ResumeModal = ({ attempt, onContinue, onRestart }) => {
  const answeredCount = Object.keys(attempt.answers || {}).length;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
        <div className="h-1.5 w-full bg-linear-to-r from-amber-400 to-orange-500" />
        <div className="p-6">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-center justify-center mb-4">
            <Clock size={22} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Resume Quiz?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
            You have an unfinished attempt for this quiz.
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-6">
            You've answered{" "}
            <span className="text-blue-500 font-bold">{answeredCount}</span> out
            of{" "}
            <span className="text-blue-500 font-bold">
              {attempt.totalQuestions}
            </span>{" "}
            questions.
          </p>
          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={onContinue}>
              Continue
            </Button>
            <Button variant="ghost" className="flex-1" onClick={onRestart}>
              Start Fresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Submit Confirm Modal ───────────────────────────────────────────────────
const SubmitModal = ({ unanswered, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden">
      <div className="h-1.5 w-full bg-linear-to-r from-blue-500 to-blue-600" />
      <div className="p-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle size={22} className="text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Submit Quiz?
        </h2>
        {unanswered > 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You have{" "}
            <span className="text-red-500 font-bold">
              {unanswered} unanswered
            </span>{" "}
            question{unanswered !== 1 ? "s" : ""}. Unanswered questions will be
            marked incorrect.
          </p>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You've answered all questions. Ready to see your results?
          </p>
        )}
        <div className="flex gap-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            Yes, Submit
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onCancel}>
            Review First
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// ── Main Quiz Page ─────────────────────────────────────────────────────────
const QuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // Core state
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResume, setShowResume] = useState(false);

  // Question navigation
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  // answers = { [questionId]: { selectedOptionIndex, isCorrect, correctOptionIndex } }

  // UI state
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRestart, setPendingRestart] = useState(false);

  const topRef = useRef(null);

  // ── Load quiz + start/resume attempt ──────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch quiz questions
        const { data: quizData } = await api.get(`/quizzes/${quizId}`);
        setQuiz(quizData.data);

        // 2. Start or resume attempt
        const { data: attemptData } = await api.post("/attempts/start", {
          quizId,
        });

        setAttempt(attemptData.data);

        if (attemptData.isResuming) {
          // Restore previous answers from DB
          const restored = {};
          const rawAnswers = attemptData.data.answers || {};
          Object.entries(rawAnswers).forEach(([qId, ans]) => {
            restored[qId] = {
              selectedOptionIndex: ans.selectedOptionIndex,
              isCorrect: ans.isCorrect,
              // We'll fetch correctOptionIndex per question when revealed
              correctOptionIndex: null,
            };
          });
          setAnswers(restored);
          setCurrentIndex(attemptData.data.currentQuestionIndex || 0);
          setShowResume(true);
        }
      } catch (err) {
        toast.error("Failed to load quiz");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [quizId]);

  // ── Scroll to top on question change ─────────────────────────────────
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentIndex]);

  // ── Handle answer selection ───────────────────────────────────────────
const handleAnswer = useCallback(async (selectedOptionIndex) => {
  if (!quiz || !attempt) return
  const question = quiz.questions[currentIndex]
  const qId      = question._id
  if (answers[qId] !== undefined) return

  setAnswers((prev) => ({
    ...prev,
    [qId]: {
      selectedOptionIndex,
      isCorrect:          null,
      correctOptionIndex: null,
      pending:            true,
    },
  }))

  try {
    const { data } = await api.patch(`/attempts/${attempt._id}/answer`, {
      questionId:           qId,
      selectedOptionIndex,
      currentQuestionIndex: currentIndex,
    })

    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        selectedOptionIndex,
        isCorrect:          data.data.isCorrect,
        correctOptionIndex: data.data.correctOptionIndex,
        pending:            false,
      },
    }))

    // ── REMOVED auto-advance ──────────────────────────────────────────
    // User reads explanation first, then clicks Next manually

  } catch {
    setAnswers((prev) => {
      const copy = { ...prev }
      delete copy[qId]
      return copy
    })
    toast.error('Connection issue. Please try again.')
  }
}, [quiz, attempt, currentIndex, answers])

  // ── Navigation ────────────────────────────────────────────────────────
  const goTo = (index) => {
    if (index < 0 || index >= quiz.questions.length) return;
    setCurrentIndex(index);
    setShowPalette(false);
  };

  // ── Resume handlers ───────────────────────────────────────────────────
  const handleContinue = () => setShowResume(false);

  const handleRestart = async () => {
    try {
      await api.post(`/attempts/${attempt._id}/abandon`);
      const { data } = await api.post("/attempts/start", { quizId });
      setAttempt(data.data);
      setAnswers({});
      setCurrentIndex(0);
      setShowResume(false);
    } catch {
      toast.error("Could not restart. Try again.");
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data } = await api.post(`/attempts/${attempt._id}/submit`);
      toast.success("Quiz submitted! 🎉");
      navigate(`/results/${attempt._id}`, {
        state: { results: data.data },
      });
    } catch {
      toast.error("Submission failed. Try again.");
    } finally {
      setSubmitting(false);
      setShowSubmit(false);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────
  const currentQuestion = quiz?.questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] : null;
  const isRevealed = currentAnswer !== undefined && currentAnswer !== null;
  const unansweredCount = quiz
    ? quiz.questions.length - Object.keys(answers).length
    : 0;

  if (loading) return <Loader text="Loading quiz..." />;
  if (!quiz) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800/95 transition-colors duration-300">
      <Navbar />

      {/* Modals */}
      {showResume && (
        <ResumeModal
          attempt={attempt}
          onContinue={handleContinue}
          onRestart={handleRestart}
        />
      )}
      {showSubmit && (
        <SubmitModal
          unanswered={unansweredCount}
          onConfirm={handleSubmit}
          onCancel={() => setShowSubmit(false)}
          loading={submitting}
        />
      )}

      {/* Mobile palette overlay */}
      {showPalette && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setShowPalette(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top bar */}
        <div
          ref={topRef}
          className="flex items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4"
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300 transition-colors shadow-sm shrink-0"
            >
              <ChevronLeft
                size={16}
                className="text-slate-600 dark:text-slate-300"
              />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 dark:text-white truncate text-xs sm:text-base">
                {quiz.title}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {quiz.subject} · {quiz.year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Answered counter — hidden on very small screens */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm">
              <span className="text-green-500 font-bold">
                {Object.keys(answers).length}
              </span>
              /{quiz.questions.length}
            </div>
            {/* Mobile palette button */}
            <button
              onClick={() => setShowPalette(true)}
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-blue-300 transition-colors shadow-sm relative"
            >
              <LayoutGrid
                size={15}
                className="text-slate-600 dark:text-slate-300"
              />
              {/* Badge showing answered count */}
              {Object.keys(answers).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {Object.keys(answers).length}
                </span>
              )}
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSubmit(true)}
            >
              <Send size={13} />
              <span className="hidden sm:inline text-xs">Submit</span>
            </Button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex gap-6 items-start">
          {/* Question area — flex-1 so palette never overlaps */}
          <div className="flex-1 min-w-0">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                questionNumber={currentIndex + 1}
                totalQuestions={quiz.questions.length}
                selectedIndex={currentAnswer?.selectedOptionIndex ?? null}
                correctIndex={currentAnswer?.correctOptionIndex ?? null}
                isRevealed={isRevealed}
                onAnswer={handleAnswer}
                currentAnswer={currentAnswer}
              />
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 sm:mt-5 gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="shrink-0"
              >
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              {/* Mobile: question counter */}
              <span className="sm:hidden text-xs font-semibold text-slate-500 dark:text-slate-400">
                {currentIndex + 1} / {quiz.questions.length}
              </span>

              {currentIndex === quiz.questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowSubmit(true)}
                  className="shrink-0"
                >
                  <span className="hidden sm:inline">Submit Quiz</span>
                  <span className="sm:hidden">Submit</span>
                  <Send size={14} />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => goTo(currentIndex + 1)}
                  className="shrink-0"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Desktop Palette — sticky, never overlaps content */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <QuestionPalette
                questions={quiz.questions}
                answers={answers}
                currentIndex={currentIndex}
                onJump={goTo}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Palette Drawer */}
      <div
        className={`
      fixed top-0 right-0 h-full w-72 z-50
      transform transition-transform duration-300
      bg-white dark:bg-slate-800 shadow-2xl
      lg:hidden
      ${showPalette ? "translate-x-0" : "translate-x-full"}
    `}
      >
        <div className="h-full overflow-y-auto p-4 pt-6">
          <QuestionPalette
            questions={quiz.questions}
            answers={answers}
            currentIndex={currentIndex}
            onJump={goTo}
            onClose={() => setShowPalette(false)}
            isMobile={true}
          />
        </div>
      </div>
    </div>
  );
};

export default QuizPage;

// ```
// ✅  Resume modal  — Continue or Start Fresh
// ✅  Question card — clean layout with question number
// ✅  4 option cards — A/B/C/D with color states
// ✅  Answer reveal  — green correct / red wrong instantly
// ✅  Explanation    — amber card shown after answering
// ✅  Question palette — numbered grid, color coded
// ✅  Dot progress bar — bottom navigation
// ✅  Submit modal  — warns about unanswered questions
// ✅  Mobile drawer — palette slides in from right
// ✅  Sticky sidebar — palette fixed on desktop scroll
// ✅  Every answer saved to DB in real time
