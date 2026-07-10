import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'
import AccountSettings from './_components/AccountSettings'
import DataExportSettings from './_components/DataExportSettings'
import DeleteAccountSettings from './_components/DeleteAccountSettings'
import NotificationSettings from './_components/NotificationSettings'
import SettingsCard from './_components/SettingsCard'
import SettingsSidebar from './_components/SettingsSidebar'
import TwoFactorSettings from './_components/TwoFactorSettings'

// The settings sidebar. Account and Security are live; the rest are shown but
// disabled until those features exist (spec 260706 item 6, Figma node 89:312).
const NAV_ITEMS = [
  {
    key: 'account',
    label: 'Account',
    description: 'Name, avatar, email',
    enabled: true,
  },
  {
    key: 'security',
    label: 'Security',
    description: 'Password & 2FA',
    enabled: true,
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Alerts & digests',
    enabled: true,
  },
  {
    key: 'privacy',
    label: 'Privacy',
    description: 'Visibility & data',
    enabled: true,
  },
  {
    key: 'preferences',
    label: 'Preferences',
    description: 'Language & theme',
    enabled: false,
  },
  {
    key: 'danger',
    label: 'Danger Zone',
    description: 'Delete account',
    enabled: true,
    danger: true,
  },
]

const SECTION_COPY = {
  account: {
    title: 'Account',
    description: 'Manage your public profile and personal details.',
  },
  security: {
    title: 'Security',
    description: 'Keep your account safe with a strong password and 2FA.',
  },
  privacy: {
    title: 'Privacy',
    description: 'Review consent records and export your account data.',
  },
  notifications: {
    title: 'Notifications',
    description: 'Choose where social alerts should surface.',
  },
  danger: {
    title: 'Danger Zone',
    description: 'Delete your account and anonymize stored personal details.',
  },
}

const renderSettingsSection = ({ activeKey, navigate, setActiveKey, user }) => {
  if (activeKey === 'account') {
    return <AccountSettings user={user} />
  }

  if (activeKey === 'privacy') {
    return <DataExportSettings user={user} />
  }

  if (activeKey === 'notifications') {
    return <NotificationSettings />
  }

  if (activeKey === 'danger') {
    return <DeleteAccountSettings user={user} />
  }

  if (user.isGuest) {
    return (
      <SettingsCard title="Account security">
        <div className="space-y-4 text-sm leading-6 text-[#6f5439]">
          <p>Save this guest profile before adding password or 2FA settings.</p>
          <button
            className="rounded-xl bg-[#E8893A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf7526] focus-visible:ring-2 focus-visible:ring-[#E8893A] focus-visible:ring-offset-2 focus-visible:outline-none"
            type="button"
            onClick={() => setActiveKey('account')}
          >
            Save progress
          </button>
        </div>
      </SettingsCard>
    )
  }

  return (
    <>
      <SettingsCard title="Password">
        <button
          className="rounded-xl bg-[#E8893A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#cf7526] focus-visible:ring-2 focus-visible:ring-[#E8893A] focus-visible:ring-offset-2 focus-visible:outline-none"
          type="button"
          onClick={() => navigate('/change-password')}
        >
          Change password
        </button>
      </SettingsCard>
      <SettingsCard title="Two-factor authentication">
        <TwoFactorSettings />
      </SettingsCard>
    </>
  )
}

const SettingsPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [activeKey, setActiveKey] = useState('account')

  if (!user) {
    return (
      <div className="flex items-center justify-center py-10 text-sm font-medium text-[#8a6a52]">
        Loading your account
      </div>
    )
  }

  const section = SECTION_COPY[activeKey] ?? SECTION_COPY.account

  return (
    <div className="-mx-5 -mt-8 -mb-12 min-h-[calc(100vh-8rem)] bg-[#fff2df] px-5 py-8">
      <div className="mx-auto w-full max-w-[1104px]">
        <h1 className="text-3xl font-black tracking-[-0.025em] text-[#1c1410] sm:text-4xl">
          Settings
        </h1>
        <p className="mt-1.5 text-sm text-[#8a6845]">
          Manage your account and security.
        </p>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
          <SettingsSidebar
            items={NAV_ITEMS}
            activeKey={activeKey}
            onSelect={setActiveKey}
          />

          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.025em] text-[#1c1410]">
                {section.title}
              </h2>
              <p className="mt-1 text-sm text-[#8a6845]">
                {section.description}
              </p>
            </div>

            {renderSettingsSection({ activeKey, navigate, setActiveKey, user })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
