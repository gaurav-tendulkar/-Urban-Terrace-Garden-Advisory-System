import Brand from '../components/Brand.jsx';
import SiteNav from '../components/SiteNav.jsx';

export default function LandingPage() {
  return (
    <>
      <SiteNav />
      <section className="hero-section" id="about">
        <div className="hero-content">
          <span className="home-eyebrow">
            <span className="material-icons-outlined" aria-hidden="true">yard</span>
            YOUR SPACE. YOUR GARDEN.
          </span>
          <h1>Turn your terrace into a garden that <span>grows with you.</span></h1>
          <p>Plan your garden before you plant. Set your space, arrange beds and plants, add finishing touches, and make the layout your own.</p>
          <div className="hero-actions">
            <a href="/build-garden" className="btn-primary home-build-cta">
              <span className="material-icons-outlined" aria-hidden="true">edit_square</span> Start designing
            </a>
            <a href="/chat" className="btn-secondary home-secondary-cta">Talk to AI</a>
          </div>
          <div className="home-hero-proof">
            <span><span className="material-icons-outlined" aria-hidden="true">straighten</span> Set your dimensions</span>
            <span><span className="material-icons-outlined" aria-hidden="true">touch_app</span> Arrange every element</span>
            <span><span className="material-icons-outlined" aria-hidden="true">save</span> Save your plan</span>
          </div>
        </div>
        <div className="hero-image-placeholder home-garden-preview" aria-label="Illustration preview of a designed terrace garden">
          <div className="home-preview-topline">
            <span><span className="home-live-dot" /> GARDEN STUDIO</span>
            <span>YOUR PLAN</span>
          </div>
          <div className="home-preview-ruler home-preview-ruler-top"><span>0</span><span>2</span><span>4</span><span>6 m</span></div>
          <div className="home-preview-ruler home-preview-ruler-side"><span>0</span><span>2</span><span>4 m</span></div>
          <div className="home-preview-canvas">
            <div className="home-preview-path" />
            <div className="home-preview-bed home-preview-bed-one">
              <img src="/icons/plants/tomato.svg" alt="" />
              <img src="/icons/plants/lettuce.svg" alt="" />
              <img src="/icons/plants/carrot.svg" alt="" />
              <img src="/icons/plants/brinjal.svg" alt="" />
            </div>
            <div className="home-preview-bed home-preview-bed-two">
              <img src="/icons/plants/coriander.svg" alt="" />
              <img src="/icons/plants/capsicum.svg" alt="" />
              <img src="/icons/plants/okra.svg" alt="" />
            </div>
            <img className="home-preview-decoration home-preview-tree" src="/icons/decorations/deciduous-tree.svg" alt="" />
            <img className="home-preview-decoration home-preview-bench" src="/icons/decorations/bench.svg" alt="" />
            <img className="home-preview-decoration home-preview-pot" src="/icons/decorations/flower-pot.svg" alt="" />
            <span className="home-preview-dimension">6 × 4 m</span>
          </div>
          <div className="home-preview-caption">
            <span className="home-preview-caption-icon material-icons-outlined" aria-hidden="true">auto_awesome</span>
            <span><strong>A little space, a lot of possibility</strong><small>Arrange it your way in the Garden Studio</small></span>
            <span className="material-icons-outlined home-preview-arrow" aria-hidden="true">arrow_forward</span>
          </div>
        </div>
      </section>

      <section className="garden-tools-section" id="garden-tools">
        <div className="section-heading">
          <span className="home-section-eyebrow">MEET YOUR GARDEN STUDIO</span>
          <h2>From empty terrace to thoughtful garden plan.</h2>
          <p>A simple visual workspace to help you make the most of the space you have.</p>
        </div>
        <div className="garden-tools-grid">
          <article className="garden-tool-card">
            <span className="garden-tool-number">01</span>
            <span className="material-icons-outlined garden-tool-icon" aria-hidden="true">aspect_ratio</span>
            <h3>Shape your space</h3>
            <p>Set your garden dimensions and see the footprint in meters as you design.</p>
          </article>
          <article className="garden-tool-card garden-tool-card-featured">
            <span className="garden-tool-number">02</span>
            <span className="material-icons-outlined garden-tool-icon" aria-hidden="true">park</span>
            <h3>Build it your way</h3>
            <p>Place beds, browse plants, and add paths, seating, pots, and other garden details.</p>
          </article>
          <article className="garden-tool-card">
            <span className="garden-tool-number">03</span>
            <span className="material-icons-outlined garden-tool-icon" aria-hidden="true">tune</span>
            <h3>Make it yours</h3>
            <p>Move, rotate, resize, and arrange elements. Choose a floor style and save your layout.</p>
          </article>
        </div>
        <div className="garden-tools-action">
          <a href="/build-garden" className="btn-primary">
            <span className="material-icons-outlined" aria-hidden="true">edit_square</span>
            Open the Garden Studio
            <span className="material-icons-outlined" aria-hidden="true">arrow_forward</span>
          </a>
          <span>No perfect plan needed. Start with the space you have.</span>
        </div>
      </section>

      <section className="garden-demo-section" id="garden-demo" aria-labelledby="garden-demo-heading">
        <div className="garden-demo-copy">
          <span className="home-section-eyebrow">A GARDEN, BUILT STEP BY STEP</span>
          <h2 id="garden-demo-heading">See your garden come together.</h2>
          <p>Start with your space, then add the pieces that make it yours. The Garden Studio lets you try ideas, move things around, and save a plan you love.</p>
          <ol className="garden-demo-steps">
            <li><span>01</span><div><strong>Set your space</strong><small>Enter your garden dimensions.</small></div></li>
            <li><span>02</span><div><strong>Add beds and paths</strong><small>Shape a layout that is easy to use.</small></div></li>
            <li><span>03</span><div><strong>Plant, decorate, save</strong><small>Finish the details and keep your design.</small></div></li>
          </ol>
          <a href="/build-garden" className="btn-primary garden-demo-cta">
            <span className="material-icons-outlined" aria-hidden="true">edit_square</span>
            Try the Garden Studio
            <span className="material-icons-outlined" aria-hidden="true">arrow_forward</span>
          </a>
        </div>
        <div className="garden-demo-visual" role="img" aria-label="Animated preview: a garden space is measured, filled with beds and a path, then planted and decorated">
          <div className="garden-demo-toolbar">
            <span className="garden-demo-window-dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="garden-demo-project">MY GARDEN PLAN</span>
            <span className="garden-demo-dimensions"><span className="material-icons-outlined" aria-hidden="true">straighten</span> 4 × 3 m</span>
          </div>
          <div className="garden-demo-canvas" aria-hidden="true">
            <div className="garden-demo-ruler garden-demo-ruler-top"><span>0</span><span>2</span><span>4 m</span></div>
            <div className="garden-demo-ruler garden-demo-ruler-side"><span>0</span><span>1.5</span><span>3 m</span></div>
            <div className="garden-demo-yard">
              <div className="garden-demo-path" />
              <div className="garden-demo-bed garden-demo-bed-one"><i /><i /><i /><i /></div>
              <div className="garden-demo-bed garden-demo-bed-two"><i /><i /><i /></div>
              <span className="garden-demo-pot"><span className="material-icons-outlined">local_florist</span></span>
              <span className="garden-demo-bench"><span className="material-icons-outlined">chair</span></span>
              <span className="garden-demo-sun"><span className="material-icons-outlined">wb_sunny</span></span>
            </div>
          </div>
          <div className="garden-demo-status"><span className="garden-demo-status-dot" /> YOUR SPACE, YOUR DESIGN</div>
        </div>
      </section>

      <footer className="landing-footer">
        <Brand />
        <div className="landing-footer-credits">
          <p>&copy; 2026 Botanica AI Systems. All rights reserved.</p>
          <p>
            Developed by{' '}
            <a href="https://www.linkedin.com/in/gaurav-tendulkar-dev" target="_blank" rel="noopener noreferrer">
              Gaurav Tendulkar
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
