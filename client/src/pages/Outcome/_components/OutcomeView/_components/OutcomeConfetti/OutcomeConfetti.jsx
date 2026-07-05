import { useEffect, useRef } from 'react'

// UNO's six card colors — the confetti is the game's own palette raining down.
const COLORS = [
  '#e03325',
  '#f4c745',
  '#489e52',
  '#3684cc',
  '#ffb04f',
  '#ea5a2a',
]
const PARTICLE_COUNT = 220
const GRAVITY = 0.12
const DRAG = 0.985

const createParticle = (width) => ({
  x: Math.random() * width,
  y: -Math.random() * 40 - 10,
  vx: (Math.random() - 0.5) * 4,
  vy: Math.random() * 2 + 1,
  size: Math.random() * 7 + 4,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
  rotation: Math.random() * Math.PI,
  spin: (Math.random() - 0.5) * 0.2,
})

// One-shot celebratory burst for a win. Canvas-based so 220 particles stay off
// the React render path. Skipped entirely under `prefers-reduced-motion`.
const OutcomeConfetti = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const canvas = canvasRef.current
    if (prefersReducedMotion || !canvas) return undefined

    const context = canvas.getContext('2d')
    let frameId = null

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    let particles = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(canvas.width),
    )

    const tick = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((particle) => {
        particle.vy = (particle.vy + GRAVITY) * DRAG
        particle.vx *= DRAG
        particle.x += particle.vx
        particle.y += particle.vy
        particle.rotation += particle.spin

        context.save()
        context.translate(particle.x, particle.y)
        context.rotate(particle.rotation)
        context.fillStyle = particle.color
        context.fillRect(
          -particle.size / 2,
          -particle.size / 2,
          particle.size,
          particle.size * 0.6,
        )
        context.restore()
      })

      particles = particles.filter(
        (particle) => particle.y < canvas.height + 20,
      )
      if (particles.length > 0) frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10"
    />
  )
}

export default OutcomeConfetti
