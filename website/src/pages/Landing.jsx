import { QRCodeSVG } from 'qrcode.react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleFaq } from '../store.js';
import { StoreBadges } from '../App.jsx';
import { BRAND, CARDS, CHIPS, FAQS, MEDIA, STATS, STORE_LINKS } from '../content.js';

const ICONS = {
  cart: 'M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 8H6.2M9 20a1 1 0 1 0 0-.01M17 20a1 1 0 1 0 0-.01',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
};

const FLOATERS = [
  { img: 'tomatoes', cls: 'f1' },
  { img: 'fruits', cls: 'f2' },
  { img: 'mushrooms', cls: 'f3' },
  { img: 'spices', cls: 'f4' },
  { img: 'veggies', cls: 'f5' },
];

export default function Landing() {
  const dispatch = useDispatch();
  const openIndex = useSelector((s) => s.faq.openIndex);
  return (
    <>
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline poster={MEDIA.heroPoster}>
          <source src={MEDIA.heroVideo} type="video/mp4" />
        </video>
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-logo">ZOOOM<span>IT</span></div>
          <h1>Groceries in minutes</h1>
          <p>Fresh groceries and daily essentials, delivered to your door in minutes.</p>
          <StoreBadges />
        </div>
        <div className="scroll-cue">Scroll down<span>⌄</span></div>
      </section>

      <section className="better">
        {FLOATERS.map((f) => (
          <img key={f.cls} className={`floater ${f.cls}`} src={MEDIA[f.img]} alt="" loading="lazy" />
        ))}
        <h2 className="grad">Better groceries for every home</h2>
        <p className="lead">From a single lemon to the whole month&apos;s ration, ZOOOMIT brings the store to you.</p>
        <div className="stats">
          {STATS.map((s) => (
            <div key={s.label}>
              <svg className="stat-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#e08a00" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[s.icon]} /></svg>
              <strong>{s.value}</strong>
              <small>{s.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="features">
        <h2>What&apos;s waiting for you on the app?</h2>
        <div className="phone-wrap">
          <div className="chips left">{CHIPS.slice(0, 4).map((c) => <span key={c} className="chip">{c}</span>)}</div>
          <div className="phone">
            <div className="phone-screen">
              <div className="ph-top">ZOOOMIT · in 10 min</div>
              <div className="ph-search">Search &quot;milk&quot;</div>
              <img src={MEDIA.shelf} alt="" loading="lazy" />
              <div className="ph-row">
                <img src={MEDIA.tomatoes} alt="" loading="lazy" />
                <img src={MEDIA.fruits} alt="" loading="lazy" />
                <img src={MEDIA.veggies} alt="" loading="lazy" />
              </div>
            </div>
          </div>
          <div className="chips right">{CHIPS.slice(4).map((c) => <span key={c} className="chip">{c}</span>)}</div>
        </div>
      </section>

      <section className="dark">
        <div className="dark-inner">
          <div className="dark-text">
            <div className="gold-logo">ZOOOMIT <span>SAVINGS</span></div>
            <h2>Save more on every order</h2>
            <p>Coupons, offers and wishlist deals for the things you buy the most.</p>
            <ul>
              <li>Coupon codes at checkout</li>
              <li>Save items to your wishlist</li>
              <li>Order for someone else with their address</li>
            </ul>
          </div>
          <img src={MEDIA.shopper} alt="Shopper picking fruit in a store" loading="lazy" />
        </div>
      </section>

      <section className="family">
        <h2>Everything your home needs</h2>
        <div className="cards">
          {CARDS.map((c) => (
            <article key={c.title} className="card" style={{ background: c.tint }}>
              <img src={MEDIA[c.img]} alt="" loading="lazy" />
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <a href={STORE_LINKS.playStore}>Check it out →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="faq">
        <h2>Quick answers</h2>
        {FAQS.map((f, i) => (
          <div key={f.q} className={`faq-item ${openIndex === i ? 'open' : ''}`}>
            <button onClick={() => dispatch(toggleFaq(i))}>{f.q}<span>{openIndex === i ? '−' : '+'}</span></button>
            {openIndex === i && <p>{f.a}</p>}
          </div>
        ))}
      </section>

      <section className="download">
        <div className="download-card">
          <div>
            <h2>Download the app now!</h2>
            <p>Scan the code or tap a store button.</p>
            <StoreBadges />
          </div>
          <div className="qr-box">
            <QRCodeSVG value={STORE_LINKS.qrTarget} size={150} />
            <small>{BRAND.name}</small>
          </div>
        </div>
      </section>
    </>
  );
}
