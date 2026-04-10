import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Zap,
  Mail,
  Lock,
  User,
  Sun,
  Moon,
  ChevronLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/api/axios";
import useAuth from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import Logo from "../components/common/Logo";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Password strength ────────────────────────────────────────────────
  const getStrength = (pw) => {
    if (!pw) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const levels = [
      { score: 0, label: "", color: "" },
      { score: 1, label: "Weak", color: "bg-red-400" },
      { score: 2, label: "Fair", color: "bg-orange-400" },
      { score: 3, label: "Good", color: "bg-yellow-400" },
      { score: 4, label: "Strong", color: "bg-blue-500" },
      { score: 5, label: "Very Strong", color: "bg-green-500" },
    ];
    return levels[Math.min(score, 5)];
  };

  const strength = getStrength(formData.password);

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errs.email = "Enter a valid email";
    if (!formData.password) errs.password = "Password is required";
    else if (formData.password.length < 6)
      errs.password = "Minimum 6 characters";
    if (!formData.confirmPassword)
      errs.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      login(data.token, data.user);
      toast.success(`Account created! Welcome, ${data.user.name} 🎉`);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      {/* ── Left Panel ───────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-400/30 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-800/30 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="w-20 h-20 bg-white backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Logo size="lg" showText="" />
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Start Your Journey
          </h1>
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            Join thousands of learners. Create your account and start taking
            quizzes today.
          </p>

          {[
            "🚀  Get started in under a minute",
            "💾  Progress saved automatically",
            "📈  Track scores over time",
          ].map((feat) => (
            <div
              key={feat}
              className="flex items-center gap-3 bg-white/15 backdrop-blur rounded-xl px-4 py-3 mb-3 text-left text-sm"
            >
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel (Form) ────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 sm:p-6">
          {/* Back to home button — always visible */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Home
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-all"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-md">
            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                Create your account ✨
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Free forever. No credit card required.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3.5 top-[42px] text-slate-400 pointer-events-none z-10"
                />
                <Input
                  label="Full name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  className="pl-10"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-[42px] text-slate-400 pointer-events-none z-10"
                />
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  className="pl-10"
                />
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-[42px] text-slate-400 pointer-events-none z-10"
                  />
                  <Input
                    label="Password"
                    name="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3.5 top-[42px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Password strength bar */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score
                              ? strength.color
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">
                      Strength:{" "}
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {strength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-[42px] text-slate-400 pointer-events-none z-10"
                />
                <Input
                  label="Confirm password"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3.5 top-[42px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-500 hover:text-blue-600 font-semibold hover:underline transition-colors"
              >
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
