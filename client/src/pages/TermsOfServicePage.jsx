import { Card, CardContent } from '@/components/ui/Card'

export default function TermsOfServicePage() {
  return (
    <div className="mx-auto max-w-4xl py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">Terms of Service</h1>
      
      <Card>
        <CardContent className="prose prose-blue max-w-none">
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Trackscendence, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">2. Description of Service</h2>
          <p>
            Trackscendence is a real-time multiplayer UNO game developed as part of the 42 London curriculum. The service provides user authentication, real-time chat, and interactive gameplay.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">3. User Conduct</h2>
          <p>When using Trackscendence, you agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the service for any unlawful purpose.</li>
            <li>Harass, abuse, or harm other players through the in-game chat or gameplay.</li>
            <li>Attempt to exploit bugs, use automated bots, or manipulate the game state to gain an unfair advantage.</li>
            <li>Share your account credentials or attempt to access other players&apos; accounts.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-4">4. Account Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at any time, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the platform.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">5. Limitation of Liability</h2>
          <p>
            Trackscendence is provided &quot;as is&quot; without warranties of any kind. As an educational project, the developers are not liable for any data loss, service interruptions, or other damages arising from your use of the platform.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
