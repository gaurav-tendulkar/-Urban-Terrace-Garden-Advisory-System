import { useState } from 'react';
import Brand from './Brand.jsx';

export default function SiteNav({ builder = false, homeOnly = false }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={`landing-nav${builder ? ' builder-nav' : ''}`}>
      <Brand />
      <ul
        className={`nav-links${builder ? '' : ' home-nav-links'}${menuOpen ? ' is-open' : ''}`}
        id={builder ? undefined : 'home-nav-links'}
      >
        {builder ? (
          <>
            <li><a href="/">Home</a></li>
            {!homeOnly && <li><a href="/chat" className="btn-primary-outline">Talk to AI</a></li>}
          </>
        ) : (
          <>
            <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
            <li><a href="/build-garden" onClick={() => setMenuOpen(false)}>Build Garden</a></li>
            <li><a href="#garden-demo" onClick={() => setMenuOpen(false)}>How It Works</a></li>
          </>
        )}
      </ul>
      {!builder && (
        <>
          <a href="/chat" className="btn-primary-outline home-nav-ai-cta">Talk to AI</a>
          <button
            type="button"
            className="home-nav-menu-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="home-nav-links"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="material-icons-outlined" aria-hidden="true">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </>
      )}
    </nav>
  );
}
