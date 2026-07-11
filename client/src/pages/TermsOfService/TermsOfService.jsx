import LegalPageShell from '@/components/LegalPageShell'
import TextLink from '@/components/TextLink'

const LAST_UPDATED = 'June 2026'

const TermsOfService = () => {
  return (
    <LegalPageShell
      footerLinks={[
        { label: 'Privacy Policy', to: '/privacy-policy' },
        { label: 'Back to login', to: '/login' },
      ]}
      lastUpdated={LAST_UPDATED}
      title="Terms of Service"
    >
      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          1. Acceptance of Terms
        </h2>
        <p className="mt-2">
          By creating an account or using Trackscendence (&quot;the
          Service&quot;), you agree to these Terms of Service. If you do not
          agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          2. Eligibility
        </h2>
        <p className="mt-2">
          The Service is available to students and staff of the associated
          institution. You must be at least 13 years old to create an account.
          Accounts created on behalf of another person without their consent are
          not permitted.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          3. Your Account
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            You are responsible for keeping your password secure. Do not share
            your credentials.
          </li>
          <li>
            You are responsible for all activity that occurs under your account.
          </li>
          <li>
            You may only create one account per person. Duplicate accounts may
            be removed without notice.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          4. Acceptable Use
        </h2>
        <p className="mt-2">You agree not to:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Cheat, exploit bugs, or use automated clients to gain an unfair
            advantage in games.
          </li>
          <li>
            Harass, threaten, or abuse other users through the chat or any other
            feature.
          </li>
          <li>
            Attempt to access another user&apos;s account or private data.
          </li>
          <li>
            Probe, scan, or test the Service for vulnerabilities without
            explicit written permission from the project team.
          </li>
          <li>
            Interfere with the normal operation of the Service (e.g.,
            denial-of-service attacks).
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          5. Usernames and Content
        </h2>
        <p className="mt-2">
          Your username must not impersonate another person or contain offensive
          language. We reserve the right to rename or remove accounts with
          inappropriate usernames. You retain ownership of any content you
          submit (e.g., chat messages), but grant us a limited license to store
          and display it to other users.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          6. Termination
        </h2>
        <p className="mt-2">
          We may suspend or terminate your account at any time if we believe you
          have violated these Terms. You may delete your account at any time by
          contacting us (see our{' '}
          <TextLink to="/privacy-policy" variant="legal">
            Privacy Policy
          </TextLink>{' '}
          for details).
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          7. Disclaimer of Warranties
        </h2>
        <p className="mt-2">
          The Service is provided &quot;as is&quot; for educational purposes. We
          make no warranties regarding uptime, data durability, or fitness for
          any particular purpose. Game results and leaderboard data may be reset
          without notice during development.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-[#1f2d28]">
          8. Changes to These Terms
        </h2>
        <p className="mt-2">
          We may update these Terms at any time. Continued use of the Service
          after changes are posted constitutes acceptance of the new Terms.
        </p>
      </section>
    </LegalPageShell>
  )
}

export default TermsOfService
