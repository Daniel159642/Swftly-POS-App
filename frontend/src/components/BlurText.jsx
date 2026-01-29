import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const directionToFrom = (direction) => {
  const offset = 24
  switch (direction) {
    case 'top': return { opacity: 0, filter: 'blur(12px)', y: -offset }
    case 'bottom': return { opacity: 0, filter: 'blur(12px)', y: offset }
    case 'left': return { opacity: 0, filter: 'blur(12px)', x: -offset }
    case 'right': return { opacity: 0, filter: 'blur(12px)', x: offset }
    default: return { opacity: 0, filter: 'blur(12px)' }
  }
}

export default function BlurText({
  text = '',
  delay = 200,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = t => t,
  onAnimationComplete,
  stepDuration = 0.35
}) {
  const elements = animateBy === 'words' ? text.split(' ').filter(Boolean) : text.split('')
  const [inView, setInView] = useState(false)
  const ref = useRef(null)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold, rootMargin }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  const from = animationFrom ?? directionToFrom(direction)
  const to = animationTo ?? { opacity: 1, filter: 'blur(0px)', x: 0, y: 0 }

  useEffect(() => {
    if (!inView || elements.length === 0 || completedRef.current) return
    const totalDelay = delay + elements.length * (stepDuration * 1000) + 100
    const t = setTimeout(() => {
      completedRef.current = true
      onAnimationComplete?.()
    }, totalDelay)
    return () => clearTimeout(t)
  }, [inView, elements.length, delay, stepDuration, onAnimationComplete])

  return (
    <motion.div ref={ref} className={className} style={{ display: 'inline' }}>
      {elements.map((el, index) => (
        <motion.span
          key={`${index}-${el}`}
          style={{ display: 'inline-block', marginRight: animateBy === 'words' && index < elements.length - 1 ? '0.25em' : undefined }}
          initial={from}
          animate={inView ? to : from}
          transition={{
            duration: stepDuration,
            delay: delay / 1000 + index * stepDuration,
            ease: easing
          }}
        >
          {el === ' ' ? '\u00A0' : el}
        </motion.span>
      ))}
    </motion.div>
  )
}
