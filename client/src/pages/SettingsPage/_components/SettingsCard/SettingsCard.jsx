// One white bordered card per settings block, matching the Figma's cards.
const SettingsCard = ({ title, children }) => (
  <section className="rounded-2xl border border-[#e8893a2e] bg-white p-6 shadow-[0_10px_30px_rgba(61,18,0,0.05)]">
    <p className="text-xs font-bold tracking-[0.14em] text-[#8a6845] uppercase">
      {title}
    </p>
    <div className="mt-4">{children}</div>
  </section>
)

export default SettingsCard
