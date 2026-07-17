// Dashboard section of the Administration console. The stat cards and
// activity panels arrive with #501; this page owns the section heading so the
// shell's routes are real from day one.
const AdminDashboard = () => (
  <section aria-labelledby="admin-dashboard-heading">
    <h1
      id="admin-dashboard-heading"
      className="text-2xl font-black tracking-tight sm:text-3xl"
    >
      Dashboard
    </h1>
    <p className="text-admin-muted mt-1 text-sm font-medium">
      Platform overview
    </p>
  </section>
)

export default AdminDashboard
