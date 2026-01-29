import { Link } from 'react-router-dom'
import BlurText from '../components/BlurText'
import './Home.css'

export default function Home() {
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-logo" />
          <Link to="/login" className="home-sign-in">Sign In</Link>
        </div>
      </header>

      <div className="home-hero">
        <BlurText
          text="Swift"
          delay={200}
          animateBy="words"
          direction="top"
          className="home-hero-title"
        />
      </div>

      <main className="home-main">
        <section className="home-section" aria-label="Section 1">
          <div className="home-section-inner" />
        </section>
        <section className="home-section" aria-label="Section 2">
          <div className="home-section-inner" />
        </section>
        <section className="home-section" aria-label="Section 3">
          <div className="home-section-inner" />
        </section>
        <section className="home-section" aria-label="Section 4">
          <div className="home-section-inner" />
        </section>
      </main>

      <nav className="home-floating-toolbar" aria-label="Floating toolbar">
        <div className="home-floating-toolbar-inner" />
      </nav>

      <footer className="home-footer">
        <div className="home-footer-inner" />
      </footer>
    </div>
  )
}
