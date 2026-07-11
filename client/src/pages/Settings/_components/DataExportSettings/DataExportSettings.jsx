import useAccountDataStore from '@/stores/useAccountDataStore'
import useNotificationStore from '@/stores/useNotificationStore'
import SettingsCard from '../SettingsCard'

const downloadJson = ({ data, username }) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `trackscendence-data-${username}.json`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const formatDate = (value) => {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const DataExportSettings = ({ user }) => {
  const isExporting = useAccountDataStore((state) => state.isExporting)

  const handleExport = async () => {
    const data = await useAccountDataStore.getState().exportAccountData()

    if (!data) {
      useNotificationStore
        .getState()
        .push(
          useAccountDataStore.getState().error || 'Data export failed',
          'error',
        )
      return
    }

    downloadJson({ data, username: user.username })
    useNotificationStore.getState().push('Data export downloaded', 'success')
  }

  return (
    <SettingsCard title="Privacy and data">
      <div className="space-y-5">
        <dl className="grid gap-3 text-sm text-[#5f4c3d] sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[#1c1410]">Terms accepted</dt>
            <dd>{formatDate(user.termsAcceptedAt)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[#1c1410]">Privacy accepted</dt>
            <dd>{formatDate(user.privacyAcceptedAt)}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="rounded-xl bg-[#2f6f86] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#24576a] focus-visible:ring-2 focus-visible:ring-[#2f6f86] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isExporting}
          onClick={handleExport}
        >
          {isExporting ? 'Preparing export...' : 'Download my data'}
        </button>
      </div>
    </SettingsCard>
  )
}

export default DataExportSettings
