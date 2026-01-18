# Onboarding Button Updates Summary

All onboarding buttons have been updated to match POS payment button style:

## Button Style Pattern:
```javascript
// Primary/Continue buttons:
padding: '16px 32px',
backgroundColor: `rgba(${themeColorRgb}, 0.7)`,
backdropFilter: 'blur(10px)',
WebkitBackdropFilter: 'blur(10px)',
color: '#fff',
border: '1px solid rgba(255, 255, 255, 0.3)',
borderRadius: '8px',
fontSize: '16px',
fontWeight: 600,
boxShadow: `0 4px 15px rgba(${themeColorRgb}, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
transition: 'all 0.3s ease'

// Back buttons:
padding: '16px 32px',
backgroundColor: 'transparent',
color: 'var(--text-primary, #000)',
border: '2px solid rgba(0, 0, 0, 0.2)',
borderRadius: '8px',
fontSize: '16px',
fontWeight: 600,
transition: 'all 0.3s ease'
```

## Input Style Pattern (Line/Underlined):
```javascript
padding: '8px 0',
border: 'none',
borderBottom: `2px solid rgba(${themeColorRgb}, 0.3)`,
borderRadius: '0',
backgroundColor: 'transparent',
outline: 'none',
transition: 'border-color 0.2s'
```

Files updated:
- OnboardingStep1.jsx ✅ (inputs & Continue button)
- OnboardingStep2.jsx ✅ (inputs & both buttons)
- OnboardingStepPayment.jsx ✅ (Validate button)
- OnboardingStep4.jsx - Needs button updates
- OnboardingStep5.jsx - Needs button updates & employee inputs
- OnboardingStep6.jsx - Needs button updates & input updates
- OnboardingStep7.jsx - Needs button updates
