import Brand from './Brand.jsx';

export default function SiteNav({ builder = false, homeOnly = false }) {
  return (
    <nav className={`landing-nav${builder ? ' builder-nav' : ''}`}>
      <Brand />
      <ul className="nav-links">
        {builder ? (
          <>
            <li><a href="/">Home</a></li>
            {!homeOnly && <li><a href="/chat" className="btn-primary-outline">Talk to AI</a></li>}
          </>
        ) : (
          <>
            <li><a href="#about">About</a></li>
            <li><a href="/build-garden">Build Garden</a></li>
            <li><a href="#garden-demo">How It Works</a></li>
            <li><a href="/chat" className="btn-primary-outline">Talk to AI</a></li>
          </>
        )}
      </ul>
    </nav>
  );
}
