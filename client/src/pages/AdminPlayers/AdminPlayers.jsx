// Players section of the Administration console. The searchable, moderated
// user table arrives with #502/#503; this page owns the section heading so
// the shell's routes are real from day one.
const AdminPlayers = () => (
  <section aria-labelledby="admin-players-heading">
    <h1
      id="admin-players-heading"
      className="text-2xl font-black tracking-tight sm:text-3xl"
    >
      Players
    </h1>
    <p className="text-admin-muted mt-1 text-sm font-medium">
      Search, review, and moderate accounts
    </p>
  </section>
)

export default AdminPlayers
