import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchAdminAccess } from '@/services/system'
import useAuthStore from '@/stores/useAuthStore'
import Layout from '@/layouts/Layout'

const AdminAccess = () => {
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadAdminAccess = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetchAdminAccess(token)

        if (isActive) {
          setResult(response)
        }
      } catch (requestError) {
        if (isActive) {
          if (requestError.status === 403) {
            navigate('/', { replace: true })
            return
          }

          setError(requestError.message)
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadAdminAccess()

    return () => {
      isActive = false
    }
  }, [navigate, token])

  return (
    <Layout>
      <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
        <section className="mx-auto w-full max-w-4xl space-y-6 px-4 sm:px-0">
          <div className="rounded-lg border border-[#d8dfd4] bg-white p-4 shadow-sm sm:p-6">
            <p className="text-sm font-semibold tracking-[0.08em] text-[#bd4f35] uppercase">
              Admin
            </p>
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-xl font-semibold sm:text-2xl">
                  Admin access
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#50635a]">
                  This screen verifies the current lightweight role-based access
                  control baseline. The backend must confirm admin access before
                  any admin-only tooling is shown.
                </p>
              </div>
              <Link
                to="/"
                className="rounded-md border border-[#cbd5c5] px-4 py-2 text-sm font-semibold text-[#27352f] transition hover:border-[#2f7d61] hover:text-[#2f7d61]"
              >
                Back to session
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="space-y-6">
              <div className="rounded-lg border border-[#d8dfd4] bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold">Current role</h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                    <p className="text-sm font-medium text-[#617267]">
                      Username
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {user?.username}
                    </p>
                  </div>
                  <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                    <p className="text-sm font-medium text-[#617267]">Role</p>
                    <p className="mt-1 text-base font-semibold">{user?.role}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#d8dfd4] bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-lg font-semibold">Permission model</h2>
                <p className="mt-2 text-sm text-[#50635a]">
                  Trackscendence currently uses a lightweight RBAC model:
                  authenticated access for standard player flows and explicit
                  admin checks for future staff-only surfaces.
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-[#d8dfd4] bg-white p-4 shadow-sm sm:p-6">
              <h2 className="text-lg font-semibold">
                Backend authorization check
              </h2>

              {isLoading ? (
                <p className="mt-4 text-sm text-[#50635a]">
                  Verifying admin access with the backend...
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 rounded-md border border-[#e2a496] bg-[#fff1ed] px-3 py-2 text-sm text-[#8a321f]">
                  {error}
                </p>
              ) : null}

              {result ? (
                <div className="mt-4 space-y-4">
                  <p className="rounded-md border border-[#bbd2c3] bg-[#eef7f1] px-3 py-2 text-sm text-[#24563f]">
                    {result.message}
                  </p>

                  <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                    <p className="text-sm font-medium text-[#617267]">
                      Authorization scope
                    </p>
                    <p className="mt-1 text-base font-semibold">
                      {result.access.scope}
                    </p>
                  </div>

                  <div className="rounded-md border border-[#e1e6de] bg-[#fbfcfa] p-4">
                    <p className="text-sm font-medium text-[#617267]">
                      Granted capabilities
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[#27352f]">
                      {result.access.capabilities.map((capability) => (
                        <li key={capability}>{capability}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </section>
      </main>
    </Layout>
  )
}

export default AdminAccess
