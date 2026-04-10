import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  BookOpen,
  RotateCcw,
  LayoutGrid,
  Moon,
  Sun,
  ChevronRight,
  CheckCircle2,
  Star,
  ArrowRight,
  GraduationCap,
  Trophy,
  Users,
  Target,
  Menu,
  X,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";
import useTheme from "@/hooks/useTheme";
import useAuth from "@/hooks/useAuth";
import Logo from "../components/common/Logo";

// ── Animated counter ───────────────────────────────────────────────────────
const useCounter = (target, duration = 2000, start = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
};

// ── Intersection observer hook ─────────────────────────────────────────────
const useInView = (threshold = 0.2) => {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
};

// ── Navbar ─────────────────────────────────────────────────────────────────
const LandingNavbar = ({ onGetStarted }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Exams", href: "#exams" },
    { label: "How it Works", href: "#how" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-700/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <div className="w-full h-10  rounded-lg flex items-center justify-center  ">
              <Logo size="lg" clickable={true} />
            </div>
          </div>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/30 hover:shadow-blue-500/50"
              >
                Go to Dashboard <ArrowRight size={14} />
              </button>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => navigate("/login")}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={onGetStarted}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-500/30"
                >
                  Get Started <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Mobile menu */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
              onClick={() => setMenuOpen((p) => !p)}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-4 flex flex-col gap-3">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 py-2"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="w-full py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-xl"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

// ── Feature Card ───────────────────────────────────────────────────────────
const FeatureCard = ({ icon: Icon, title, desc, color, bg, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center mb-4`}
      >
        <Icon size={22} className={color} />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>
  );
};

// ── Exam Badge ─────────────────────────────────────────────────────────────
const ExamBadge = ({ icon, label, desc, color, subjects, available }) => {
  const [ref, inView] = useInView();
  const navigate = useNavigate();
 const { user } = useAuth(); // 👈 replace with your auth hook

  const handleClick = () => {
    if (!available) return;
    user ? navigate("/dashboard") : navigate("/login");
  };

  return (
    <div ref={ref} className="relative">

      {/* Coming Soon overlay — only for unavailable cards */}
      {!available && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-[3px]">
          <span className="text-3xl">🚧</span>
          <span className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide">
            Coming Soon
          </span>
        </div>
      )}

      {/* Original card — preserved exactly */}
      <div
        onClick={handleClick}
        className={`relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-500
          ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          ${available
            ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer"
            : "opacity-60 cursor-not-allowed"
          }`}
      >
        {/* original bg circle decoration */}
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2`}
        />
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="font-black text-slate-800 dark:text-white text-xl mb-1">
          {label}
        </h3>
        <p className="text-xs text-slate-400 mb-4">{desc}</p>
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => (
            <span
              key={s}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium ${color} bg-opacity-10 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700`}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

// ── Step Card ──────────────────────────────────────────────────────────────
const StepCard = ({ number, title, desc, icon: Icon, delay }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`flex gap-5 transition-all duration-500 ${
        inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/30 shrink-0">
          {number}
        </div>
        {number < 4 && (
          <div className="w-0.5 flex-1 bg-linear-to-b from-blue-300 to-transparent mt-2" />
        )}
      </div>
      <div className="pb-10">
        <div className="flex items-center gap-2 mb-1">
          <Icon size={16} className="text-blue-500" />
          <h3 className="font-bold text-slate-800 dark:text-white">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  );
};

// ── Stats Section ──────────────────────────────────────────────────────────
const StatsSection = () => {
  const [ref, inView] = useInView();
  const papers = useCounter(50, 1800, inView);
  const subjects = useCounter(11, 1500, inView);
  const students = useCounter(100, 2000, inView);
  const accuracy = useCounter(98, 1600, inView);

  const stats = [
    {
      value: `${papers}+`,
      label: "Question Papers",
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      value: `${subjects}+`,
      label: "Subjects Covered",
      icon: GraduationCap,
      color: "text-purple-500",
    },
    {
      value: `${students}+`,
      label: "Students",
      icon: Users,
      color: "text-green-500",
    },
    {
      value: `${accuracy}%`,
      label: "Content Accuracy",
      icon: Target,
      color: "text-amber-500",
    },
  ];

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white/10 dark:bg-white/5 backdrop-blur rounded-2xl p-5 text-center border border-white/20"
        >
          <stat.icon size={24} className={`${stat.color} mx-auto mb-2`} />
          <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
          <p className="text-sm text-blue-100">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

// ── Main Landing Page ──────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const heroRef = useRef(null);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    // Slight delay for hero animation
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleGetStarted = () => {
    if (user) navigate("/dashboard");
    else navigate("/register");
  };

  const features = [
    {
      icon: RotateCcw,
      title: "Resume Anytime",
      desc: "Left midway? No problem. Your progress is automatically saved. Continue exactly where you left off — even days later.",
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/30",
    },
    {
      icon: LayoutGrid,
      title: "Question Palette",
      desc: "See all questions at a glance. Color-coded palette shows answered, current, and pending questions. Jump to any question instantly.",
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/30",
    },
    {
      icon: CheckCircle2,
      title: "Instant Explanations",
      desc: "Every answer reveals a detailed explanation immediately. Understand why an answer is correct, not just what it is.",
      color: "text-green-500",
      bg: "bg-green-50 dark:bg-green-900/30",
    },
    {
      icon: TrendingUp,
      title: "Detailed Results",
      desc: "Get a full breakdown of your performance. Review every question, see correct answers, and track your improvement over time.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/30",
    },
    {
      icon: Shield,
      title: "Authentic Papers",
      desc: "Practice with real previous year question papers from official examinations. Nothing fabricated.",
      color: "text-red-500",
      bg: "bg-red-50 dark:bg-red-900/30",
    },
    {
      icon: Clock,
      title: "Timed Practice",
      desc: "Simulate real exam conditions with timed tests. Build speed and accuracy before your actual examination day.",
      color: "text-cyan-500",
      bg: "bg-cyan-50 dark:bg-cyan-900/30",
    },
  ];

  // Update your exams array
const exams = [
  {
    icon: "🎓",
    label: "CUET UG",
    desc: "Common University Entrance Test — Undergraduate",
    color: "bg-blue-500",
    available: true,  
    subjects: ["Agricultural Science", "Chemistry", "Botany", "Biochemistry", "Physics", "Mathematics", "+more"],
  },
  {
    icon: "📚",
    label: "NEET",
    desc: "National Eligibility cum Entrance Test — Undergraduate",
    color: "bg-purple-500",
    available: false,  
    subjects: ["Biology", "Chemistry", "Physics"],
  },
  {
    icon: "🏛️",
    label: "UGC NET",
    desc: "National Eligibility Test for Lectureship & JRF",
    color: "bg-emerald-500",
    available: false,  // ❌ coming soon
    subjects: ["Paper 1 (General)", "Computer Science", "Life Sciences", "Education", "+more"],
  },
];

  const steps = [
    {
      number: 1,
      icon: GraduationCap,
      title: "Select Your Exam",
      desc: "Choose an exam to begin your preparation journey.",
    },
    {
      number: 2,
      icon: BookOpen,
      title: "Pick Subject & Year",
      desc: "Browse by stream and subject. Choose from multiple years of previous papers.",
    },
    {
      number: 3,
      icon: Target,
      title: "Attempt the Quiz",
      desc: "Answer MCQs with instant feedback, explanations, and a live question palette.",
    },
    {
      number: 4,
      icon: Trophy,
      title: "Review & Improve",
      desc: "Get detailed results, see where you went wrong, and track your progress.",
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <LandingNavbar onGetStarted={handleGetStarted} />

      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-linear-to-br from-slate-50 via-blue-50/50 to-slate-50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
            style={{
              backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 rounded-full px-4 py-1.5 mb-8 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {/* Trusted by thousands of students across India */}
                Excel By Previous Year Question's
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              Revise{" "}
              <span className="relative">
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-cyan-500">
                  Smarter
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="8"
                  viewBox="0 0 200 8"
                >
                  <path
                    d="M0,6 Q50,0 100,5 Q150,10 200,4"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
              </span>{" "}
              with Previous Year Papers
            </h1>

            <p
              className={`text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              Practice with authentic previous year question papers. Get instant
              explanations, track your progress, and resume anytime — all in one
              {/* beautifully designed . */} platform
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <button
                onClick={handleGetStarted}
                className="group flex items-center justify-center gap-2 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start Practicing Free
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("how")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-base rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              >
                How it works
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Social proof */}
            <div
              className={`flex flex-col sm:flex-row items-center justify-center gap-6 text-sm transition-all duration-700 delay-400 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
              <div className="flex items-center gap-1">
                {/* {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className="text-amber-400 fill-amber-400"
                  />
                ))} */}
                {/* <span className="ml-2 text-slate-500 dark:text-slate-400">
                  Loved by{" "}
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    10,000+
                  </span>{" "}
                  students
                </span> */}
              </div>
              <span className="hidden sm:block text-slate-300 dark:text-slate-600">
                {/* | */}
              </span>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <CheckCircle2 size={14} className="text-green-500" />
                Free to use · No credit card needed
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-slate-400">Scroll to explore</span>
          <div className="w-5 h-8 border-2 border-slate-300 dark:border-slate-600 rounded-full flex justify-center pt-1.5">
            <div className="w-1 h-2 bg-slate-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats Banner ─────────────────────────────────────────────── */}
      <section className="py-16 bg-linear-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StatsSection />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
              Why Excel By PYQ?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mt-2 mb-4">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-cyan-500">
                ace your exam
              </span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-base">
              Designed from the ground up for competitive exam preparation
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Exams ────────────────────────────────────────────────────── */}
      <section id="exams" className="py-24 bg-white dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
              Exams Covered
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mt-2 mb-4">
              Papers for every competitive exam
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
              More exams and subjects added regularly. All papers sourced from
              official question banks.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamBadge key={exam.label} {...exam} />
            ))}
          </div>
          <div className="mt-8 text-center">
            <span className="text-sm text-slate-400 dark:text-slate-500">
              🚧 More exams coming soon — CUET PG , GATE, JEE & more
            </span>
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────────── */}
      <section id="how" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                How it works
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white mt-2 mb-4">
                From zero to exam-ready in 4 simple steps
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">
                No complicated setup. Just sign up, pick your exam, and start
                practicing. It really is that simple.
              </p>
              <div>
                {steps.map((step, i) => (
                  <StepCard key={step.number} {...step} delay={i * 100} />
                ))}
              </div>
            </div>

            {/* Visual mockup */}
            <div className="relative hidden lg:block">
              <div className="sticky top-24">
                {/* Fake quiz card */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <div className="h-1.5 bg-linear-to-r from-blue-400 to-cyan-500" />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">
                        Question 7 of 50
                      </span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 font-bold px-2.5 py-1 rounded-full">
                        ✓ Correct!
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-white mb-5 leading-relaxed text-sm">
                      Which one of the following is a chemical property of soil?
                    </p>
                    {[
                      { text: "Soil pH", correct: true, selected: true },
                      {
                        text: "Soil structure",
                        correct: false,
                        selected: false,
                      },
                      { text: "Soil color", correct: false, selected: false },
                      {
                        text: "Soil plasticity",
                        correct: false,
                        selected: false,
                      },
                    ].map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 mb-2 text-sm transition-all ${
                          opt.correct
                            ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                            : "border-slate-100 dark:border-slate-700 opacity-50"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            opt.correct
                              ? "bg-green-500 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-400"
                          }`}
                        >
                          {["A", "B", "C", "D"][i]}
                        </span>
                        <span
                          className={
                            opt.correct
                              ? "text-green-700 dark:text-green-300 font-medium"
                              : "text-slate-400"
                          }
                        >
                          {opt.text}
                        </span>
                        {opt.correct && (
                          <CheckCircle2
                            size={15}
                            className="ml-auto text-green-500"
                          />
                        )}
                      </div>
                    ))}
                    {/* Explanation */}
                    <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 p-4">
                      <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                        💡 Explanation
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Soil pH is a chemical property that indicates the
                        acidity or alkalinity of soil, affecting nutrient
                        availability for plants.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Floating palette preview */}
                <div className="absolute -right-6 top-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 w-44">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">
                    Question Palette
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div
                        key={i}
                        className={`aspect-square rounded-lg text-xs font-bold flex items-center justify-center ${
                          i < 6
                            ? "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400 text-[10px]"
                            : i === 6
                              ? "bg-blue-500 text-white text-[10px]"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-400 text-[10px]"
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────── */}
      <section className="py-24 bg-linear-to-br from-blue-600 via-blue-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 leading-tight">
            Ready to start your exam preparation?
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Your competitors are already practicing. Don't fall behind.{" "}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group flex items-center justify-center gap-2 px-10 py-4 bg-white text-blue-600 font-black text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center justify-center gap-2 px-10 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-base rounded-2xl border border-white/30 transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 dark:bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-full h-10  rounded-lg flex items-center justify-center  ">
                <Logo size="md" />
              </div>
            </div>
            <p className="text-sm text-slate-500 text-center">
              Built for students preparing for CUET, UGC NET & more competitive
              exams.
            </p>
            <div className="flex items-center gap-5">
              {["Features", "Exams", "How it Works"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/ /g, "")}`}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} Excel By PYQ. Made with ❤️ for Indian
              students.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
