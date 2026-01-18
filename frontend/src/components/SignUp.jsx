import { SignUp } from '@clerk/clerk-react'
import { useTheme } from '../contexts/ThemeContext'

function SignUpPage() {
  const { themeColor } = useTheme()

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px var(--shadow)',
        border: '1px solid var(--border-light)'
      }}>
        <SignUp 
          routing="path"
          path="/sign-up"
          signInUrl="/master-login"
          afterSignUpUrl="/login"
          appearance={{
            elements: {
              rootBox: {
                margin: '0 auto'
              },
              card: {
                backgroundColor: 'var(--bg-primary)',
                boxShadow: 'none'
              },
              headerTitle: {
                color: 'var(--text-primary)'
              },
              headerSubtitle: {
                color: 'var(--text-secondary)'
              },
              formButtonPrimary: {
                backgroundColor: themeColor,
                '&:hover': {
                  backgroundColor: themeColor,
                  opacity: 0.9
                }
              },
              formFieldInput: {
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-light)'
              },
              formFieldLabel: {
                color: 'var(--text-primary)'
              },
              footerActionLink: {
                color: themeColor
              },
              identityPreviewText: {
                color: 'var(--text-primary)'
              },
              identityPreviewEditButton: {
                color: themeColor
              }
            }
          }}
        />
      </div>
    </div>
  )
}

export default SignUpPage
