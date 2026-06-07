import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'

const SignupPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
  })
  const [error, setError] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showTerms, setShowTerms] = useState(false)
  const [termsViewed, setTermsViewed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const [showPrivacy, setShowPrivacy] = useState(false)
  const [privacyViewed, setPrivacyViewed] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const handleChange = (event) => {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError([])
    setIsSubmitting(true)

    try {
      await register(form)
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Sign in to continue.' },
      })
    } catch (requestError) {
	  const details = requestError.payload?.details

	  if (details?.length) {
	    setError(details)
	  } else {
        setError([requestError.message])
	  }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f2] px-5 py-10 text-[#1f2d28]">
      <section className="w-full max-w-md rounded-lg border border-[#d8dfd4] bg-white p-6 shadow-sm">
        <div className="mb-7">
          <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
            Trackscendence
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Create your account</h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium">Email</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Username</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Password</span>
            <input
              className="mt-2 w-full rounded-md border border-[#cbd5c5] px-3 py-2 text-base transition outline-none focus:border-[#2f7d61] focus:ring-2 focus:ring-[#2f7d61]/20"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

		  <div className="space-y-2">
		    <button
			  type="button"
			  className="text-sm font-medium text-[#2f6f86] underline"
			  onClick={() => setShowTerms(true)}
			>
			Terms of Service
			</button>

			<label className="flex items-center gap-2 text-sm">
			  <input
			    type="checkbox"
				checked={termsAccepted}
				disabled={!termsViewed}
				onChange={(event) => setTermsAccepted(event.target.checked)}
			  />
			  <span>I agree to the Terms of Service</span>
			</label>
		  </div>

		  <div className="space-y-2">
		    <button
			  type="button"
			  className="text-sm font-medium text-[#2f6f86] underline"
			  onClick={() => setShowPrivacy(true)}
			>
			Privacy Policy
			</button>

			<label className="flex items-center gap-2 text-sm">
			  <input
			    type="checkbox"
				checked={privacyAccepted}
				disabled={!privacyViewed}
				onChange={(event) => setPrivacyAccepted(event.target.checked)}
			  />
			  <span>I agree to the Privacy Policy</span>
			</label>
		  </div>

          {error.length > 0 ? (
		    <div className="rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
			  <ul className="list-disc pl-5">
			    {error.map((message) => (
				  <li key={message}>{message}</li>
				))}
			  </ul>
			</div>
		  ) : null}

          <button
            className="w-full rounded-md bg-[#2f7d61] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#276a52] disabled:cursor-not-allowed disabled:bg-[#91a69b]"
            type="submit"
            disabled={isSubmitting || !termsAccepted || !privacyAccepted}
          >
            {isSubmitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#50635a]">
          Already registered?{' '}
          <Link
            className="font-semibold text-[#2f6f86] hover:text-[#24586a]"
            to="/login"
          >
            Log in
          </Link>
        </p>
      </section>

      {showTerms && (
	    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		  <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
		    <h2 className="mb-4 text-xl font-semibold">
			  Terms of Service
			</h2>
			<p>
			  In order to use the Trackscendence website you much agree to the terms of service you are reading.

			  You agree not to temper with or otherwise hack the site in any way.

			  You must agree to only use the website in the manner it was intended to be used, which is playing the Uno! card game, making friends, viewing profiles, chatting to other user on the website and other obvious uses of the website.

			  You must agree not to use this website to commit any crimes, harass others, or otherwise conduct malicious activities.

			  Uno! is not owned by any of the creator of this website and this website is not meant to be monetized in anyway. This website is only meant for educationational purposes.
			</p>
			<button
			  type="button"
			  className="mt-6 rounded-md bg-[#2f7d61] px-4 py-2 text-white"
			  onClick={() => {
			    setTermsViewed(true)
				setShowTerms(false)
			  }}
			>
			  Close
			</button>
		  </div>
		</div>
	  )}

      {showPrivacy && (
	    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
		  <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6">
		    <h2 className="mb-4 text-xl font-semibold">
			  Privacy Policy 
			</h2>
			<p>
			  In order to use the Trackscendence website you much agree to the Privacy Policy you are reading.

			  We do NOT share, give, or sell Trackscendence website user data in way shape or form. Emails used for authenication users at signup and possibly emailing uses about website updates. Chats that are made public are public, but private message are not available to anyone other than the user that wrote them and who they personally share them with. 
			</p>
			<button
			  type="button"
			  className="mt-6 rounded-md bg-[#2f7d61] px-4 py-2 text-white"
			  onClick={() => {
			    setPrivacyViewed(true)
				setShowPrivacy(false)
			  }}
			>
			  Close
			</button>
		  </div>
		</div>
	  )}

    </main>
  )
}

export default SignupPage
