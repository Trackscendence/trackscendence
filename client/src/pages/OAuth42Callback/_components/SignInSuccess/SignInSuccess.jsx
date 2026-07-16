// Brief confirmation shown after a successful 42 sign-in, before the container
// redirects into the waiting room. Mirrors SignupSuccess (warm surface, navy
// ink, blue check) so the auth flow feels like one continuous space. Pure
// presenter — the parent owns the redirect timer.
const SignInSuccess = ({ username }) => (
  <div className="bg-surface-warm flex min-h-[100dvh] items-center justify-center px-4 py-8 text-[#081934] sm:px-5 sm:py-10">
    <div className="w-full max-w-[414px] text-center">
      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#0196FF]">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 24L20 34L38 14"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="mb-4 text-4xl font-semibold uppercase">Signed in</h1>

      <p className="text-[#081934]">
        {username ? `Welcome back, ${username}. ` : 'Welcome back. '}
        Taking you to the table…
      </p>
    </div>
  </div>
)

export default SignInSuccess
