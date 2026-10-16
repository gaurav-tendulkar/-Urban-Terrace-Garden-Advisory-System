import { useEffect, useState } from 'react';
import Brand from '../components/Brand.jsx';
import SiteNav from '../components/SiteNav.jsx';

export default function LandingPage() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!submitted) return undefined;
    const timeout = window.setTimeout(() => setSubmitted(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [submitted]);

  function submitInquiry(event) {
    event.preventDefault();
    event.currentTarget.reset();
    setSubmitted(true);
  }

  return (
    <>
      <SiteNav />
      <section className="hero-section" id="about">
        <div className="hero-content">
          <h1>Cultivate Your Perfect Garden with <span>AI Intelligence</span></h1>
          <p>Welcome to Botanica. We provide personalized plant care, advanced soil health analytics, and instant horticulture troubleshooting powered by Artificial Intelligence.</p>
          <div className="hero-actions">
            <a href="/chat" className="btn-primary">
              <span className="material-icons-outlined">forum</span> Ask Botanica Now
            </a>
            <a href="#inquiry" className="btn-secondary">Send an Inquiry</a>
          </div>
        </div>
        <div className="hero-image-placeholder">
          <div className="glass-card decor-card">
            <span className="material-icons-outlined large-icon">park</span>
            <h3>Smart Botany</h3>
            <p>Diagnose issues instantly.</p>
          </div>
        </div>
      </section>

      <section className="plant-info-section" id="plant-info">
        <div className="section-heading">
          <h2>Plant Care Essentials</h2>
          <p>Master the basics with our quick guides to keep your foliage thriving.</p>
        </div>
        <div className="cards-grid">
          <div className="glass-card">
            <span className="material-icons-outlined icon-accent">water_drop</span>
            <h3>Watering Cycles</h3>
            <p>Overwatering is the #1 plant killer. Learn the soak-and-dry method for succulents and tropicals to prevent root rot.</p>
          </div>
          <div className="glass-card">
            <span className="material-icons-outlined icon-accent">wb_sunny</span>
            <h3>Light Requirements</h3>
            <p>Understand the difference between bright indirect light, partial shade, and direct sun to optimize photosynthesis.</p>
          </div>
          <div className="glass-card">
            <span className="material-icons-outlined icon-accent">eco</span>
            <h3>Soil Composition</h3>
            <p>A good mix needs drainage and retention. Add perlite for aeration, and peat moss or coco coir for moisture control.</p>
          </div>
        </div>
      </section>

      <section className="inquiry-section" id="inquiry">
        <div className="inquiry-container glass-card">
          <div className="inquiry-text">
            <h2>Have a Complicated Garden Project?</h2>
            <p>Drop us a line! Whether it's landscaping consultation or a large-scale pest infestation, our human experts are here to supplement the AI.</p>
          </div>
          <form className="inquiry-form" onSubmit={submitInquiry}>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" placeholder="E.g. Jane Doe" required />
            </div>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" placeholder="jane@example.com" required />
            </div>
            <div className="input-group">
              <label htmlFor="plant-type">Plant/Project Type</label>
              <select id="plant-type" required defaultValue="">
                <option value="" disabled>Select an option</option>
                <option value="indoor">Indoor Houseplants</option>
                <option value="outdoor">Outdoor Landscaping</option>
                <option value="pests">Pest/Disease Control</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="message">Your Message</label>
              <textarea id="message" rows="4" placeholder="How can we help your garden flourish?" required />
            </div>
            <button type="submit" className="btn-primary w-100">Submit Inquiry</button>
            <div className={`hidden-message${submitted ? ' show-message' : ''}`} aria-live="polite">
              Success! Your inquiry has been planted. 🌿
            </div>
          </form>
        </div>
      </section>

      <footer className="landing-footer">
        <Brand />
        <p>&copy; 2026 Botanica AI Systems. All rights reserved.</p>
      </footer>
    </>
  );
}
