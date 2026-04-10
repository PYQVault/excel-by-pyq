import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuth from '@/hooks/useAuth'
import Loader from '@/components/common/Loader'

const GoogleAuthSuccessPage = () => {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const { login }      = useAuth()

  useEffect(() => {
    const token = searchParams.get('token')
    const user  = searchParams.get('user')

    if (token && user) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(user))
        login(token, parsedUser)
        navigate('/dashboard', { replace: true })
      } catch {
        navigate('/login?error=google_failed', { replace: true })
      }
    } else {
      navigate('/login?error=google_failed', { replace: true })
    }
  }, [])

  return <Loader text="Signing you in with Google..." />
}

export default GoogleAuthSuccessPage