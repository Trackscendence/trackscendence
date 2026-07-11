import LegalPageShell from '@/components/LegalPageShell'

const LAST_UPDATED = 'June 2026'

const PrivacyPolicy = () => {
  return (
    <LegalPageShell
      footerLinks={[
        { label: 'Terms of Service', to: '/terms-of-service' },
        { label: 'Back to login', to: '/login' },
      ]}
      lastUpdated={LAST_UPDATED}
      title="Privacy Policy"
    >
      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          1. Information We Collect
        </h2>
        <p className="mt-2">
          When you create an account on Trackscendence, we collect the following
          information:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Email address</strong> — used to identify your account and
            send password-reset emails.
          </li>
          <li>
            <strong>Username</strong> — displayed publicly on the leaderboard
            and in game lobbies.
          </li>
          <li>
            <strong>Password</strong> — stored as a bcrypt hash; we never store
            it in plain text.
          </li>
          <li>
            <strong>Game data</strong> — match results, scores, and tournament
            history generated while you use the platform.
          </li>
        </ul>
        <p className="mt-2">
          We do not collect payment information, location data, or any biometric
          data.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          2. How We Use Your Information
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>To authenticate you and maintain your session securely.</li>
          <li>
            To display your username and statistics on the leaderboard and match
            history pages.
          </li>
          <li>
            To send transactional emails (password reset, account verification)
            — we send no marketing emails.
          </li>
          <li>To detect and prevent abuse or cheating.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          3. Data Sharing
        </h2>
        <p className="mt-2">
          We do not sell, rent, or share your personal data with third parties.
          Your email address is never made public. Your username and game
          statistics are visible to other logged-in users as part of the game
          experience.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          4. Data Retention
        </h2>
        <p className="mt-2">
          Your account and all associated data are retained for as long as your
          account exists. You may request deletion of your account and all
          personal data by contacting us (see Section 7). We will process
          deletion requests within 30 days.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          5. Cookies and Local Storage
        </h2>
        <p className="mt-2">
          Trackscendence stores a session token in your browser&apos;s local
          storage to keep you logged in. We do not use advertising cookies or
          third-party tracking scripts.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">6. Security</h2>
        <p className="mt-2">
          All passwords are hashed with bcrypt before storage. API communication
          is encrypted in transit. Session tokens are JWTs that expire after 7
          days. Despite these measures, no system is perfectly secure — please
          use a unique password for your account.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">7. Contact</h2>
        <p className="mt-2">
          If you have questions about this policy or want to request data
          deletion, please open an issue on our project repository or contact
          the project team directly through your institution&apos;s channels.
        </p>
      </section>
    </LegalPageShell>
  )
}

export default PrivacyPolicy
