import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import Navbar from '@/components/common/Navbar'

const TermsPage = () => {
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

        <button
  onClick={handleBack}
  className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500 mb-6 transition-colors"
>
  <ArrowLeft size={16} /> Back
</button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center">
            <FileText size={22} className="text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white">
              Terms & Conditions
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Last updated: April 30, 2026
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 sm:p-10 shadow-sm">
          <div className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">

            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-200 font-medium mb-6">
              By using Excel By PYQ, you agree to these terms. Please read them carefully.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">1. About Us</h2>
            <p>
              Excel By PYQ ("we", "us", "our") is an educational platform based in Bengaluru, Karnataka, India. We provide previous year question papers and practice tools for CUET UG, CUET PG, NEET, UGC NET, and similar Indian competitive examinations. The platform is currently operated as an independent student project and is in the process of being registered as a business entity.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">2. Eligibility</h2>
            <p>
              You must be at least <strong>14 years old</strong> to use Excel By PYQ. If you are under 18, you should use the platform with appropriate parental awareness or consent. By creating an account, you confirm you meet this age requirement.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">3. Your Account</h2>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>You must provide accurate information when registering</li>
              <li>Keep your password confidential and don't share your account</li>
              <li>You're responsible for all activity under your account</li>
              <li>Notify us immediately if you suspect unauthorized access</li>
              <li>One person, one account — multiple accounts may be terminated</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">4. Free and Future Paid Plans</h2>
            <p>
              Excel By PYQ is currently <strong>completely free</strong> for all users. We plan to introduce optional paid plans with premium features in the future (estimated within 6 months). Free features will continue to be available. When paid plans launch:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>You will be notified via email and on-site banner before any charges</li>
              <li>You'll never be charged without explicit consent</li>
              <li>Refund policies will be clearly published</li>
              <li>Your existing free access will not be removed without notice</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">5. What You Can Do</h2>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Practice previous year questions for personal exam preparation</li>
              <li>Track your progress and review your performance</li>
              <li>Share your honest feedback with us</li>
              <li>Access the platform on any device</li>
            </ul>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">6. What You Cannot Do</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Copy, scrape, redistribute, or commercially exploit our content without written permission</li>
              <li>Use bots, scripts, or automated tools to access the platform</li>
              <li>Try to hack, reverse engineer, or break the security of the platform</li>
              <li>Create fake accounts or impersonate someone else</li>
              <li>Upload offensive, illegal, or harmful content via feedback</li>
              <li>Resell access to your account or share login credentials publicly</li>
              <li>Use the platform to spam, harass, or harm other users</li>
            </ul>
            <p>
              Violation may result in immediate account termination and, in serious cases, legal action.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">7. Question Papers and Content</h2>
            <p>
              The previous year question papers featured on Excel By PYQ are the intellectual property of their respective examination authorities (NTA, UGC, etc.). We have collected, organized, and digitized these papers for educational and practice purposes only. We do not claim ownership of the original questions.
            </p>
            <p className="mt-3">
              Our explanations, UI design, code, and platform features are our intellectual property and are protected by copyright laws. You may not copy or reuse them without our written permission.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">8. Accuracy of Content</h2>
            <p>
              We work hard to ensure questions, answer keys, and explanations are accurate. However, mistakes can happen. We make <strong>no warranty</strong> that all content is error-free. Always cross-verify with official sources before relying on any answer for high-stakes decisions. If you spot an error, please report it via the Feedback option — we'll fix it quickly.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">9. No Guarantee of Exam Success</h2>
            <p>
              Practicing on Excel By PYQ can improve your preparation, but we don't guarantee any specific exam result, rank, or score. Your performance depends on your study efforts and many other factors. We are not responsible for any exam outcomes.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">10. Service Availability</h2>
            <p>
              We try to keep the platform running 24/7, but occasional downtime may happen for maintenance, updates, or technical issues. We are not liable for losses caused by temporary unavailability.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent allowed by Indian law, Excel By PYQ and its founders are not liable for any indirect, incidental, or consequential damages including but not limited to loss of data, lost study time, missed exams, or financial loss arising from use or inability to use the platform.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">12. Account Termination</h2>
            <p>You can delete your account anytime by contacting us at <a href="mailto:pyqvault@gmail.com" className="text-blue-500 hover:underline">pyqvault@gmail.com</a>.</p>
            <p className="mt-3">
              We may suspend or terminate accounts that violate these terms, without prior notice in serious cases (such as hacking, abuse, or fraud).
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">13. Changes to These Terms</h2>
            <p>
              We may update these terms from time to time. Significant changes will be announced via email or on-site banner. Continued use after changes means you accept the new terms. The "Last updated" date will always reflect the latest version.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">14. Governing Law and Jurisdiction</h2>
            <p>
              These terms are governed by the laws of <strong>India</strong>. Any dispute will be resolved exclusively by the courts in <strong>Bengaluru, Karnataka, India</strong>. By using the platform, you agree to this jurisdiction.
            </p>

            <h2 className="text-xl font-bold text-slate-800 dark:text-white mt-8 mb-3">15. Contact Us</h2>
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

            <p className="mt-8 text-xs text-slate-400 italic">
              By using Excel By PYQ, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
            </p>

          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsPage