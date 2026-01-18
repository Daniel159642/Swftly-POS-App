import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

const STEP_TEXTS = [
  'Welcome',
  'Let\'s Begin',
  'Get Started',
  'Almost There',
  'Final Step',
  'You\'re Ready'
]

function OnboardingHeader({ step = 1, direction = 'forward' }) {
  const { themeColor } = useTheme()

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '132, 0, 255'
  }

  const themeColorRgb = hexToRgb(themeColor)
  
  // Get text for current step
  const currentText = STEP_TEXTS[Math.min(step - 1, STEP_TEXTS.length - 1)] || STEP_TEXTS[0]

  return (
    <h2 style={{ 
      marginBottom: '30px',
      fontSize: '48px',
      fontWeight: 700,
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontStyle: 'italic',
      letterSpacing: '2px',
      textAlign: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '20px'
    }}>
      <span style={{ color: themeColor }}>Swyft</span>
      <div style={{
        backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: '12px 24px',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: '60px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
      }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={step}
            initial={{ y: direction === 'backward' ? -50 : 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: direction === 'backward' ? 50 : -50, opacity: 0 }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 400,
              duration: 0.3
            }}
            style={{ 
              color: '#fff', 
              whiteSpace: 'nowrap',
              display: 'inline-block'
            }}
          >
            {currentText}
          </motion.span>
        </AnimatePresence>
      </div>
    </h2>
  )
}

export default OnboardingHeader
