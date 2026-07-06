import { create } from 'zustand'

// Which UNO logo the app renders. Production ships the default ('text', the
// original lettered badge) and never changes it — only the dev Controls panel
// calls `setVariant`, and that panel is stripped from production builds. This
// lets David preview the raster ('png') and the traced vector ('svg') logos
// side by side in dev before we commit to one and retire the others. Kept in a
// normal store (not the dev store) so the `Logo` presenter can subscribe
// without pulling the dev module into the production bundle.
export const LOGO_VARIANTS = ['text', 'png', 'svg']

const useLogoStore = create((set) => ({
  variant: 'text',
  setVariant: (variant) => set({ variant }),
}))

export default useLogoStore
