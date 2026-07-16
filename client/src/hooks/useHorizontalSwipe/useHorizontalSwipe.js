import { useRef } from 'react'

// A swipe must travel this far to count, and must be clearly more horizontal
// than vertical so normal page scrolling never flips a tab.
const MIN_DISTANCE_PX = 56
const AXIS_DOMINANCE = 1.5

// Touches that start inside a horizontally scrollable element (a wide table,
// a card carousel) belong to that element's own scrolling.
const startsInsideHorizontalScroller = (target, boundary) => {
  let element = target
  while (element && element !== boundary) {
    if (element.scrollWidth > element.clientWidth + 1) return true
    element = element.parentElement
  }
  return false
}

// Recognizes deliberate horizontal swipes on the element the returned handlers
// are spread onto, reporting 'left' or 'right' through onSwipe.
const useHorizontalSwipe = (onSwipe) => {
  const startPoint = useRef(null)

  const onTouchStart = (event) => {
    if (
      event.touches.length !== 1 ||
      startsInsideHorizontalScroller(event.target, event.currentTarget)
    ) {
      startPoint.current = null
      return
    }
    const touch = event.touches[0]
    startPoint.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (event) => {
    if (!startPoint.current) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - startPoint.current.x
    const deltaY = touch.clientY - startPoint.current.y
    startPoint.current = null

    if (Math.abs(deltaX) < MIN_DISTANCE_PX) return
    if (Math.abs(deltaX) < Math.abs(deltaY) * AXIS_DOMINANCE) return
    onSwipe(deltaX < 0 ? 'left' : 'right')
  }

  return { onTouchStart, onTouchEnd }
}

export default useHorizontalSwipe
