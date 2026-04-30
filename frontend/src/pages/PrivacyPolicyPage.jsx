import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import Navbar from '@/components/common/Navbar'

const PrivacyPolicyPage = () => {
  const navigate = useNavigate()
  const handleBack = () => {
  // If opened in new tab — close it
  // If has history — go back
  // Otherwise — go to home
  if (window.history.length > 2) {
    navigate(-1)
  } else {
    window.close()
    // Fallback if window.close doesn't work (browser blocks it)
    setTimeout(() => navigate('/'), 100)
  }
}

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <button
  onClick={handleBack}
  className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500 mb-6 transition-colors"
>
  <ArrowLeft size={16} /> Back
</button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center">
            <Shield size={22} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Last updated: April 30, 2026
            </p>
          </div>
        </div>

        {/* Content card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 sm:p-10 shadow-sm">

          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">

            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium mb-6">
              At Excel By PYQ, we respect your privacy and are committed to protecting your personal information. This policy explains what we collect, how we use it, and your rights.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">1. Who We Are</h2>
            <p>
              Excel By PYQ is an educational platform based in Bengaluru, Karnataka, India that provides previous year question papers for CUET UG, CUET PG, NEET, UGC NET and similar competitive exams. The platform is currently operated as an independent student project and will be registered as a business soon.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-5 mb-2">When you create an account:</h3>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong>Name and email</strong> — to identify you and send important emails</li>
              <li><strong>Password</strong> — stored securely in encrypted (hashed) form. We never see or store your actual password.</li>
              <li><strong>Google profile data</strong> — if you sign in with Google, we receive your name, email, and profile picture</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-5 mb-2">When you use the platform:</h3>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Quiz attempts, answers, scores, and time taken</li>
              <li>Pages you visit and features you use</li>
              <li>Browser type, device, and IP address (technical logs)</li>
              <li>Feedback messages you send</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-5 mb-2">What we don't collect:</h3>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Payment or financial information (the platform is currently free)</li>
              <li>Aadhaar, PAN, or any government IDs</li>
              <li>Phone numbers (unless you choose to share)</li>
              <li>Information from children under 14</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Create and manage your account</li>
              <li>Save your quiz progress and show your results</li>
              <li>Send important emails (OTP verification, password reset, important account notices)</li>
              <li>Improve the platform by understanding which features are used most</li>
              <li>Detect and prevent fraud, abuse, or technical issues</li>
              <li>Respond to your feedback and support requests</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">4. Future Paid Features</h2>
            <p>
              We plan to introduce optional paid features in the future. When we do, additional billing-related information may be collected through secure payment partners. We will update this policy and notify you in advance. The free tier will continue to remain available.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">5. Where We Store Your Data</h2>
            <p>Your data is stored securely with the following service providers:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong>MongoDB Atlas</strong> — primary database (cloud-based)</li>
              <li><strong>Vercel</strong> — hosts our website</li>
              <li><strong>Render</strong> — hosts our backend servers</li>
              <li><strong>Google OAuth</strong> — for "Sign in with Google"</li>
              <li><strong>Resend</strong> — sends our emails</li>
              <li><strong>Cloudinary</strong> — stores images used in question papers</li>
              <li><strong>Google Search Console</strong> — analyzes how the site appears in search results</li>
            </ul>
            <p>
              All these providers are major, reputable services with strong security practices. We do not sell your data to anyone.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">6. Cookies</h2>
            <p>We use cookies and local storage to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Keep you logged in (session cookies)</li>
              <li>Remember your dark mode / light mode preference</li>
              <li>Save your place in an unfinished quiz</li>
            </ul>
            <p>
              You can disable cookies in your browser settings, but this may affect login and quiz progress features.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong>Access</strong> your data — ask us what we have about you</li>
              <li><strong>Correct</strong> any wrong information</li>
              <li><strong>Delete</strong> your account and all associated data</li>
              <li><strong>Download</strong> your quiz history in a readable format</li>
              <li><strong>Opt-out</strong> of non-essential emails</li>
            </ul>
            <p>
              To exercise any of these rights, email us at <a href="mailto:pyqvault@gmail.com" className="text-blue-500 hover:underline">pyqvault@gmail.com</a>. We respond within 7 business days.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">8. Age Requirement</h2>
            <p>
              Excel By PYQ is intended for students aged <strong>14 and above</strong>. Users under 18 should use the platform with awareness and (where appropriate) consent of a parent or guardian. We do not knowingly collect data from anyone under 14. If you believe we have, please contact us immediately at <a href="mailto:pyqvault@gmail.com" className="text-blue-500 hover:underline">pyqvault@gmail.com</a> for prompt removal.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">9. Data Retention</h2>
            <p>
              We keep your data as long as your account is active. If you delete your account, we permanently remove your personal data within 30 days. Some anonymized analytics data may be retained longer to improve the platform.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">10. Security</h2>
            <p>
              We use industry-standard practices to protect your data — including HTTPS encryption, hashed passwords (bcrypt), JWT-based authentication, and access-controlled databases. However, no internet service is 100% secure. We do our best, but cannot guarantee absolute protection.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this policy as the platform evolves. Major changes will be communicated via email or a banner on the website. The "Last updated" date at the top will always reflect the most recent version.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">12. Contact Us</h2>
            <div className="bg-slate-50 dark:bg-slate-700/40 rounded-2xl p-5 mt-3">
              <p className="font-semibold text-slate-800 dark:text-white mb-1">Excel By PYQ</p>
              <p className="text-sm">Bengaluru, Karnataka, India</p>
              <p className="text-sm mt-2">
                Email: <a href="mailto:pyqvault@gmail.com" className="text-blue-500 hover:underline font-semibold">pyqvault@gmail.com</a>
              </p>
              <p className="text-sm">
                Website: <a href="https://www.excelbypyq.com" className="text-blue-500 hover:underline font-semibold">excelbypyq.com</a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage