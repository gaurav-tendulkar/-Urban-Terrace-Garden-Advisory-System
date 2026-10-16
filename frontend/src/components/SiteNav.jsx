import Brand from './Brand.jsx';

export default function SiteNav({ builder = false }) {
  return (
    <nav className={`landing-nav${builder ? ' builder-nav' : ''}`}>
      <Brand />
      <ul className="nav-links">
        {builder ? (
          <>
            <li><a href="/">Home</a></li>
            <li><a href="/chat" className="btn-primary-outline">Talk to AI</a></li>
          </>
        ) : (
          <>
            <li><a href="#about">About</a></li>
            <li><a href="/build-garden">Build Garden</a></li>
            <li><a href="#plant-info">Plant Guides</a></li>
            <li><a href="#inquiry">Inquiry Form</a></li>
            <li><a href="/chat" className="btn-primary-outline">Talk to AI</a></li>
          </>
        )}
      </ul>
    </nav>
  );
}
