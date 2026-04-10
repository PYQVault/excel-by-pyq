import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft, Zap } from 'lucide-react'
import Logo from '../components/common/Logo'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4 transition-colors duration-300">

      {/* Logo */}
      <div
        className="flex items-center gap-2 mb-12 cursor-pointer"
        onClick={() => navigate('/')}
      >
       <div className="w-full h-10  rounded-lg flex items-center justify-center  ">
              <Logo size="lg"  />
            </div>
      </div>

      {/* 404 */}
      <div className="relative mb-8">
        <p className="text-[9rem] sm:text-[12rem] font-black text-slate-100 dark:text-slate-800 leading-none select-none">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl">🔍</div>
        </div>
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mb-3 text-center">
        Page not found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-10 leading-relaxed">
        The page you are looking for does not exist or has been moved.
        Let us get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:border-blue-300 transition-all text-sm shadow-sm"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all text-sm shadow-md shadow-blue-500/30"
        >
          <Home size={16} />
          Back to Home
        </button>
      </div>

    </div>
  )
}

export default NotFoundPage
