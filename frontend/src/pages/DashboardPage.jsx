import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Search,
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Target,
  GraduationCap,
  FlaskConical,
  Layers,
  Calendar,
  X,
  SlidersHorizontal,
  MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/axios";
import useAuth from "@/hooks/useAuth";
import Navbar from "@/components/common/Navbar";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";

// ── Exam config (add new exams here in future) ─────────────────────────────
const EXAM_CONFIG = {
  CUET_UG: {
    label: "CUET UG",
    fullName: "Common University Entrance Test (UG)",
    icon: "🎓",
    color: "from-blue-500 to-blue-600",
    lightBg: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-700",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  CUET_PG: {
    label: "NEET",
    fullName: "National Eligibility cum Entrance Test — Undergraduate",
    icon: "📚",
    color: "from-purple-500 to-purple-600",
    lightBg: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-700",
    badge:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  },
  UGC_NET: {
    label: "UGC NET",
    fullName: "National Eligibility Test",
    icon: "🏛️",
    color: "from-emerald-500 to-emerald-600",
    lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-700",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
};

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-200">
    <div
      className={`w-10 h-10 sm:w-12 sm:h-12 ${bg} rounded-xl flex items-center justify-center shrink-0`}
    >
      <Icon size={18} className={color} />
    </div>
    <div className="min-w-0">
      <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-none mb-0.5">
        {value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
        {label}
      </p>
    </div>
  </div>
);

// ── Breadcrumb ─────────────────────────────────────────────────────────────
const Breadcrumb = ({ items, onNavigate }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    {items.map((item, i) => (
      <div key={i} className="flex items-center gap-1.5">
        {i > 0 && <ChevronRight size={14} className="text-slate-400" />}
        <button
          onClick={() => onNavigate(i)}
          className={`text-sm font-medium transition-colors ${
            i === items.length - 1
              ? "text-slate-800 dark:text-white cursor-default"
              : "text-blue-500 hover:text-blue-600 hover:underline"
          }`}
        >
          {item}
        </button>
      </div>
    ))}
  </div>
);

// ── Status Badge ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    in_progress:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    not_started:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  };
  const labels = {
    in_progress: "⏳ In Progress",
    completed: "✅ Completed",
    not_started: "🚀 Not Started",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

// ── Quiz Card ──────────────────────────────────────────────────────────────
const QuizCard = ({ quiz, attempt, onAction, examKey }) => {
  const status =
    attempt?.status === 'in_progress' ? 'in_progress'
    : attempt?.status === 'completed'  ? 'completed'
    : 'not_started'

  const answeredCount = attempt?.answers
    ? Object.keys(attempt.answers).length
    : 0

  // Score in marks (not percentage) — matches new +5/-1 system
  const totalMarks = attempt?.score ?? null
  const maxMarks   = (attempt?.totalQuestions ?? 0) * 5
  const scorePercent = totalMarks !== null && maxMarks > 0
    ? Math.max(0, Math.round((totalMarks / maxMarks) * 100))
    : null

  // Year + variant label: "2024", "2024 · A", "2024 · B"
  const yearLabel = quiz.variant
    ? `${quiz.year} · ${quiz.variant}`
    : `${quiz.year}`

  // Subject or fallback
  const subjectLabel = quiz.subject || 'General Aptitude Test'

  // Status bar color
  const barColor =
    status === 'completed'   ? 'bg-green-500'
    : status === 'in_progress' ? 'bg-amber-400'
    : 'bg-blue-500'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all duration-200 overflow-hidden">

      {/* Thin status bar */}
      <div className={`h-1 w-full ${barColor}`} />

      <div className="p-5">

        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">

            {/* Year badge + subject */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                {yearLabel}
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                {subjectLabel}
              </span>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen size={12} />
            {quiz.questionCount} Questions
          </span>
          {quiz.timeLimitMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {quiz.timeLimitMinutes} min
            </span>
          )}
        </div>

        {/* Progress bar — in progress */}
        {status === 'in_progress' && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Progress</span>
              <span>{answeredCount} / {attempt.totalQuestions} answered</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.round((answeredCount / attempt.totalQuestions) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Score row — completed */}
        {status === 'completed' && totalMarks !== null && (
          <div className="mb-4 flex items-center justify-between bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Score</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {totalMarks} / {maxMarks} marks
              </p>
            </div>
            <span className={`text-xl font-black ${
              scorePercent >= 80 ? 'text-green-500'
              : scorePercent >= 60 ? 'text-blue-500'
              : scorePercent >= 40 ? 'text-amber-500'
              : 'text-red-500'
            }`}>
              {scorePercent}%
            </span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-1">
          {status === 'not_started' && (
            <Button variant="primary" size="sm" className="flex-1"
              onClick={() => onAction(quiz._id, 'start')}>
              <PlayCircle size={14} /> Start Quiz
            </Button>
          )}

          {status === 'in_progress' && (
            <>
              <Button variant="primary" size="sm" className="flex-1"
                onClick={() => onAction(quiz._id, 'continue')}>
                <PlayCircle size={14} /> Continue
              </Button>
              <Button variant="ghost" size="sm"
                onClick={() => onAction(quiz._id, 'restart', attempt._id)}
                title="Restart">
                <RotateCcw size={13} />
              </Button>
            </>
          )}

          {status === 'completed' && (
            <>
              <Button variant="secondary" size="sm" className="flex-1"
                onClick={() => onAction(quiz._id, 'results', attempt._id)}>
                <Trophy size={14} /> View Results
              </Button>
              <Button variant="ghost" size="sm"
                onClick={() => onAction(quiz._id, 'restart', attempt._id)}
                title="Retake">
                <RotateCcw size={13} />
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Drill-down state
  const [view, setView] = useState("home"); // home | stream | subject | quizzes
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Data
  const [meta, setMeta] = useState({}); // full exam→stream→subject tree
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // ── Fetch meta tree + attempts on mount ─────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [metaRes, attemptsRes] = await Promise.all([
          api.get("/quizzes/meta"),
          api.get("/attempts/my-attempts"),
        ]);
        setMeta(metaRes.data.data);

        const map = {};
        attemptsRes.data.data.forEach((a) => {
          const qid = a.quizId?._id || a.quizId;
          if (!map[qid] || a.status === "in_progress") map[qid] = a;
        });
        setAttempts(map);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── Fetch quizzes when subject selected ─────────────────────────────
  useEffect(() => {
    if (view !== "quizzes" || !selectedExam) return;

    const fetchQuizzes = async () => {
      setQuizLoading(true);
      try {
        const params = {
          exam: selectedExam,
          stream: selectedStream,
        };

        // Only add subject param if it's a real subject
        if (selectedSubject && selectedSubject !== "General Aptitude") {
          params.subject = selectedSubject;
        }

        const { data } = await api.get("/quizzes", { params });
        setQuizzes(data.data);
      } catch {
        toast.error("Failed to load quizzes");
      } finally {
        setQuizLoading(false);
      }
    };

    fetchQuizzes();
  }, [view, selectedExam, selectedStream, selectedSubject]);

  // ── Search ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const search = async () => {
      try {
        const { data } = await api.get("/quizzes", {
          params: { search: searchQuery },
        });
        setSearchResults(data.data || []);
      } catch {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Stats ────────────────────────────────────────────────────────────
  const allAttempts = Object.values(attempts);
  const stats = {
    completed: allAttempts.filter((a) => a.status === "completed").length,
    inProgress: allAttempts.filter((a) => a.status === "in_progress").length,
    avgScore: (() => {
      const done = allAttempts.filter((a) => a.status === "completed");
      if (!done.length) return "—";
      const avg =
        done.reduce(
          (s, a) => s + Math.round((a.score / a.totalQuestions) * 100),
          0,
        ) / done.length;
      return `${Math.round(avg)}%`;
    })(),
    totalExams: Object.keys(meta).length,
  };

  // ── Navigation ───────────────────────────────────────────────────────
  const handleBreadcrumb = (index) => {
    if (index === 0) {
      setView("home");
      setSelectedExam(null);
      setSelectedStream(null);
      setSelectedSubject(null);
    }
    if (index === 1) {
      setView("stream");
      setSelectedStream(null);
      setSelectedSubject(null);
    }
    if (index === 2) {
      setView("subject");
      setSelectedSubject(null);
    }
  };

  const handleAction = async (quizId, action, attemptId) => {
    if (action === "results") {
      navigate(`/results/${attemptId}`);
      return;
    }
    if (action === "restart") {
      const existing = attempts[quizId];
      if (existing?.status === "in_progress") {
        try {
          await api.post(`/attempts/${existing._id}/abandon`);
        } catch {
          toast.error("Could not restart");
          return;
        }
      }
    }
    navigate(`/quiz/${quizId}`);
  };

  // ── Breadcrumb items ─────────────────────────────────────────────────
  const breadcrumbs = ["Home"];
  if (selectedExam)
    breadcrumbs.push(EXAM_CONFIG[selectedExam]?.label || selectedExam);
  if (selectedStream) breadcrumbs.push(selectedStream);
  if (selectedSubject && selectedSubject !== "General Aptitude") {
    breadcrumbs.push(selectedSubject);
  }

  if (loading) return <Loader text="Loading your dashboard..." />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Welcome + Stats ─────────────────────────────────────────── */}
        {view === "home" && (
          <>
            {/* Welcome Header */}
            <div className="flex flex-col gap-4 mb-6 sm:mb-8">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">
                      Hey, {user?.name?.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {stats.inProgress > 0
                        ? `${stats.inProgress} quiz${stats.inProgress > 1 ? "zes" : ""} in progress`
                        : "Select an exam to get started"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search trigger — full width on mobile */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all shadow-sm w-full sm:w-72 sm:self-end"
              >
                <Search size={15} />
                <span className="flex-1 text-left">Search quizzes...</span>
                <kbd className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono hidden sm:block">
                  /
                </kbd>
              </button>
            </div>

            {/* Stats — 2 cols on mobile, 4 on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
              <StatCard
                icon={GraduationCap}
                label="Exams"
                value={stats.totalExams || "—"}
                color="text-blue-500"
                bg="bg-blue-50 dark:bg-blue-900/30"
              />
              <StatCard
                icon={CheckCircle2}
                label="Completed"
                value={stats.completed}
                color="text-green-500"
                bg="bg-green-50 dark:bg-green-900/30"
              />
              <StatCard
                icon={TrendingUp}
                label="In Progress"
                value={stats.inProgress}
                color="text-amber-500"
                bg="bg-amber-50 dark:bg-amber-900/30"
              />
              <StatCard
                icon={Target}
                label="Avg. Score"
                value={stats.avgScore}
                color="text-purple-500"
                bg="bg-purple-50 dark:bg-purple-900/30"
              />
            </div>

            {/* Exam Selector */}
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                Select Your Exam
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Choose an exam to browse previous year papers
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(EXAM_CONFIG).map(([key, cfg]) => {
                  const examData = meta[key];
                  const streamCount = examData
                    ? Object.keys(examData).length
                    : 0;
                  const subjectCount = examData
                    ? Object.values(examData).reduce(
                        (s, streams) => s + Object.keys(streams).length,
                        0,
                      )
                    : 0;
                  const quizCount = examData
                    ? Object.values(examData).reduce(
                        (s, streams) =>
                          s +
                          Object.values(streams).reduce(
                            (ss, subjects) => ss + subjects.length,
                            0,
                          ),
                        0,
                      )
                    : 0;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (!examData) {
                          toast("No papers available yet for this exam");
                          return;
                        }
                        setSelectedExam(key);
                        setView("stream");
                      }}
                      className={`group relative text-left p-6 rounded-2xl border-2 transition-all duration-300
                        bg-white dark:bg-slate-800 hover:shadow-xl
                        ${
                          examData
                            ? `${cfg.border} hover:border-blue-400 cursor-pointer`
                            : "border-slate-100 dark:border-slate-700 opacity-60 cursor-not-allowed"
                        }`}
                    >
                      {/* Gradient blob */}
                      <div
                        className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${cfg.color} opacity-10 rounded-2xl`}
                      />

                      <div className="relative z-10">
                        <div className="text-4xl mb-3">{cfg.icon}</div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                          {cfg.label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                          {cfg.fullName}
                        </p>

                        {examData ? (
                          <div className="flex items-center gap-3 text-xs">
                            <span
                              className={`px-2 py-1 rounded-lg font-semibold ${cfg.badge}`}
                            >
                              {subjectCount} Subjects
                            </span>
                            <span
                              className={`px-2 py-1 rounded-lg font-semibold ${cfg.badge}`}
                            >
                              {quizCount} Papers
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Coming soon
                          </span>
                        )}

                        {examData && (
                          <div className="mt-4 flex items-center gap-1 text-blue-500 text-xs font-semibold group-hover:gap-2 transition-all">
                            Browse papers <ChevronRight size={14} />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Stream View ─────────────────────────────────────────────── */}
        {view === "stream" && selectedExam && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => {
                  setView("home");
                  setSelectedExam(null);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors shadow-sm"
              >
                <ChevronLeft
                  size={18}
                  className="text-slate-600 dark:text-slate-300"
                />
              </button>
              <div>
                <Breadcrumb items={breadcrumbs} onNavigate={handleBreadcrumb} />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                  Select Section
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(meta[selectedExam] || {}).map(
                ([stream, subjects]) => {
                  const subjectCount = Object.keys(subjects).length;
                  const quizCount = Object.values(subjects).reduce(
                    (s, q) => s + q.length,
                    0,
                  );
                  const cfg = EXAM_CONFIG[selectedExam];

                  return (
                    <button
                      key={stream}
                      onClick={() => {
                        setSelectedStream(stream);
                        const subjects = meta[selectedExam][stream];
                        const subjectKeys = Object.keys(subjects);

                        // If only key is 'General Aptitude' → no subjects → go straight to quizzes
                        if (
                          subjectKeys.length === 1 &&
                          subjectKeys[0] === "General Aptitude"
                        ) {
                          setSelectedSubject("General Aptitude");
                          setView("quizzes");
                        } else {
                          setView("subject");
                        }
                      }}
                      className="group text-left p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300"
                    >
                      <div
                        className={`w-10 h-10 bg-linear-to-br ${cfg.color} rounded-xl flex items-center justify-center mb-3`}
                      >
                        <Layers size={18} className="text-white" />
                      </div>
                      <h3 className="font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {stream}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                        {subjectCount} subject{subjectCount !== 1 ? "s" : ""} ·{" "}
                        {quizCount} paper{quizCount !== 1 ? "s" : ""}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(subjects)
                          .slice(0, 3)
                          .map((sub) => (
                            <span
                              key={sub}
                              className={`text-xs px-2 py-0.5 rounded-md font-medium ${cfg.badge}`}
                            >
                              {sub}
                            </span>
                          ))}
                        {Object.keys(subjects).length > 3 && (
                          <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 dark:bg-slate-700 text-slate-500">
                            +{Object.keys(subjects).length - 3} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </>
        )}

        {/* ── Subject View ─────────────────────────────────────────────── */}
        {view === "subject" && selectedStream && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => {
                  setView("stream");
                  setSelectedStream(null);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors shadow-sm"
              >
                <ChevronLeft
                  size={18}
                  className="text-slate-600 dark:text-slate-300"
                />
              </button>
              <div>
                <Breadcrumb items={breadcrumbs} onNavigate={handleBreadcrumb} />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                  Select Domain Specific Subject
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Object.entries(meta[selectedExam]?.[selectedStream] || {}).map(
                ([subjectKey, papers]) => {
                  const cfg = EXAM_CONFIG[selectedExam];
                  const displayName =
                    subjectKey === "General Aptitude" ? selectedStream : subjectKey;

                  return (
                    <button
                      key={subjectKey}
                      onClick={() => {
                        setSelectedSubject(subjectKey);
                        setView("quizzes");
                      }}
                      className="group text-left p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300"
                    >
                      <div
                        className={`w-10 h-10 ${cfg.lightBg} rounded-xl flex items-center justify-center mb-3`}
                      >
                        <FlaskConical size={18} className="text-blue-500" />
                      </div>
                      <h3 className="font-bold text-slate-700 dark:text-white text-sm leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {displayName}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {papers.length} paper{papers.length !== 1 ? "s" : ""}
                        </span>
                        <div className="flex gap-1">
                          {papers.slice(0, 3).map((p) => (
                            <span
                              key={p.year}
                              className={`text-xs px-1.5 py-0.5 rounded font-semibold ${cfg.badge}`}
                            >
                              {p.year}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </>
        )}

        {/* ── Quizzes View ─────────────────────────────────────────────── */}
        {view === "quizzes" && selectedSubject && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => {
                  setView("subject");
                  setSelectedSubject(null);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-colors shadow-sm"
              >
                <ChevronLeft
                  size={18}
                  className="text-slate-600 dark:text-slate-300"
                />
              </button>
              <div>
                <Breadcrumb items={breadcrumbs} onNavigate={handleBreadcrumb} />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-0.5">
                  Previous Year Papers
                </h2>
              </div>
            </div>

            {quizLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : quizzes.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-5xl mb-3">📭</div>
                <h3 className="font-semibold text-slate-600 dark:text-slate-400">
                  No papers yet
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  Papers for this subject will be added soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {quizzes
                  .sort((a, b) => b.year - a.year)
                  .map((quiz) => (
                    <QuizCard
                      key={quiz._id}
                      quiz={quiz}
                      attempt={attempts[quiz._id] || null}
                      onAction={handleAction}
                      examKey={selectedExam}
                    />
                  ))}
              </div>
            )}
          </>
        )}

        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-700/50 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">
             Have a suggestion? We'd love to hear from you.
          </p>
          <button
            onClick={() => navigate("/feedback")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-500 transition-all shadow-sm"
          >
            <MessageSquare size={15} />
            Send Feedback
          </button>
        </div>
      </main>

      {/* ── Search Modal ─────────────────────────────────────────────────── */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search by exam, subject, year..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none text-sm"
              />
              <button onClick={() => setSearchOpen(false)}>
                <X
                  size={18}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                />
              </button>
            </div>

            {/* Tags suggestion */}
            {!searchQuery && (
              <div className="p-4">
                <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
                  Quick Filters
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "CUET UG ", q: "CUET" },
                    { label: "2022 Papers", q: "2022" },
                    { label: "2023 Papers", q: "2023" },
                    { label: "2024 Papers", q: "2024" },
                    { label: "2025 Papers", q: "2025" },
                  ].map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => setSearchQuery(tag.q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-medium transition-all border border-slate-200 dark:border-slate-600"
                    >
                      <SlidersHorizontal size={11} />
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search results */}
            {searchQuery && (
              <div className="max-h-80 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No quizzes found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="p-2">
                    {searchResults.map((quiz) => {
                      const cfg = EXAM_CONFIG[quiz.exam];
                      return (
                        <button
                          key={quiz._id}
                          onClick={() => {
                            setSearchOpen(false);
                            navigate(`/quiz/${quiz._id}`);
                          }}
                          className="w-full text-left flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors"
                        >
                          <div
                            className={`w-9 h-9 bg-linear-to-br ${cfg?.color || "from-blue-500 to-blue-600"} rounded-lg flex items-center justify-center shrink-0 text-sm`}
                          >
                            {cfg?.icon || "📄"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                              {quiz.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {quiz.exam?.replace("_", " ")} · {quiz.stream} ·{" "}
                              {quiz.subject} · {quiz.year}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-slate-400">
                              {quiz.questionCount} Qs
                            </span>
                            <ChevronRight
                              size={14}
                              className="text-slate-300"
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;