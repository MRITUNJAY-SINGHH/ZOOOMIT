import { useEffect } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { closeMenu, hideStickyBar, toggleMenu } from './store.js';
import { BRAND, STORE_LINKS } from './content.js';
import Landing from './pages/Landing.jsx';
import Privacy from './pages/Privacy.jsx';
import DeleteAccount from './pages/DeleteAccount.jsx';

export function Logo({ dark }) {
  return (
    <Link to="/" className={`logo ${dark ? 'logo-dark' : ''}`} aria-label={`${BRAND.name} home`}>
      ZOOOM<span>IT</span>
    </Link>
  );
}

export function StoreBadges() {
  return (
    <div className="badges">
      <a className="badge" href={STORE_LINKS.playStore}>
        <small>GET IT ON</small>
        <strong>Google Play</strong>
      </a>
      <a className="badge" href={STORE_LINKS.appStore}>
        <small>Download on the</small>
        <strong>App Store</strong>
      </a>
    </div>
  );
}

function Header() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.ui.menuOpen);
  const { pathname } = useLocation();
  const solid = pathname !== '/';
  return (
    <header className={`header ${solid ? 'header-solid' : ''}`}>
      <Logo dark={solid} />
      <nav className={`nav ${open ? 'nav-open' : ''}`} onClick={() => dispatch(closeMenu())}>
        <Link to="/">Home</Link>
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/delete-account">Delete Account</Link>
      </nav>
      <button className="burger" aria-label="Menu" onClick={() => dispatch(toggleMenu())}>
        <span /><span /><span />
      </button>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <Logo />
          <p className="muted">{BRAND.tagline}.</p>
          <StoreBadges />
        </div>
        <div>
          <h4>Company</h4>
          <Link to="/">Home</Link>
          <a href={`mailto:${BRAND.supportEmail}`}>Contact</a>
        </div>
        <div>
          <h4>Legal</h4>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/delete-account">Delete Account</Link>
        </div>
      </div>
      <p className="legal">
        © {new Date().getFullYear()} {BRAND.businessName}. ZOOOMIT is the brand name of the app.
      </p>
    </footer>
  );
}

function StickyBar() {
  const dispatch = useDispatch();
  const visible = useSelector((s) => s.ui.stickyBarVisible);
  if (!visible) return null;
  return (
    <div className="sticky-bar">
      <a className="btn" href={STORE_LINKS.playStore}>Order on app</a>
      <button aria-label="Close" onClick={() => dispatch(hideStickyBar())}>×</button>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/privacy-policy" element={<Privacy />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </main>
      <Footer />
      {pathname === '/' && <StickyBar />}
    </>
  );
}
