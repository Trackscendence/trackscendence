
import { Card, CardContent } from '@/components/ui/Card'

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl py-12">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-gray-900">Privacy Policy</h1>
      
      <Card>
        <CardContent className="prose prose-blue max-w-none">
          <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">1. Introduction</h2>
          <p>
            Welcome to Trackscendence. This Privacy Policy explains how we collect, use, and protect your personal information when you use our multiplayer game and related services.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">2. Information We Collect</h2>
          <p>We collect the following types of information when you use our platform:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Your username, email address, and hashed password when you register.</li>
            <li><strong>Gameplay Data:</strong> Your match history, win/loss records, and in-game actions during UNO matches.</li>
            <li><strong>Communication Data:</strong> Messages sent through our real-time chat system during active sessions.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-4">3. How We Use Your Information</h2>
          <p>Your information is used strictly to provide and improve the Trackscendence experience:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>To authenticate your account and secure your sessions.</li>
            <li>To facilitate multiplayer matchmaking and real-time gameplay.</li>
            <li>To maintain leaderboards and player statistics.</li>
            <li>To communicate important account updates or security alerts.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-4">4. Data Security</h2>
          <p>
            We implement industry-standard security measures, including HTTPS encryption and secure password hashing, to protect your data. JWT tokens are used to manage your active sessions securely.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">5. Your Rights</h2>
          <p>
            You have the right to request access to the personal data we hold about you, or request its deletion. If you wish to delete your account and associated gameplay data, please contact the administrators.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
