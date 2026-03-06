'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import './landing.css';

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('11:00 AM');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animate slots
  const availableSlots = ['10:00 AM', '10:30 AM', '11:30 AM', '1:30 PM', '2:00 PM'];
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      setSelectedSlot(availableSlots[idx % availableSlots.length]);
      idx++;
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const slots = [
    { time: '9:00 AM', status: 'taken' },
    { time: '9:30 AM', status: 'taken' },
    { time: '10:00 AM', status: 'available' },
    { time: '10:30 AM', status: 'available' },
    { time: '11:00 AM', status: 'available' },
    { time: '11:30 AM', status: 'available' },
    { time: '1:00 PM', status: 'taken' },
    { time: '1:30 PM', status: 'available' },
    { time: '2:00 PM', status: 'available' },
  ];

  return (
    <>
      <div className="landing">
        {/* NAVBAR */}
        <nav className={`l-nav ${scrolled ? 'scrolled' : ''}`}>
          <div className="l-brand">
            <span>🦷</span> ILoveDentist
          </div>
          <ul className="l-nav-links">
            <li><a href="#services">Services</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#branches">Our Branches</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><Link href="/login" className="l-nav-cta">Staff Login</Link></li>
          </ul>
          <button className="l-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span/><span/><span/>
          </button>
        </nav>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="l-mobile-menu">
            <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#branches" onClick={() => setMenuOpen(false)}>Our Branches</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
            <Link href="/login" onClick={() => setMenuOpen(false)}>Staff Login →</Link>
          </div>
        )}

        {/* HERO */}
        <section className="l-hero">
          <div className="l-hero-content">
            <div className="l-badge">✦ Trusted by 2,000+ patients</div>
            <h1 className="l-title">
              Your <span className="accent">Smile</span> is Our<br/>
              <span className="underlined">Priority</span>
            </h1>
            <p className="l-desc">
              ILoveDentist Clinic offers world-class dental care across multiple branches.
              Book your appointment today and experience dentistry done right.
            </p>
            <div className="l-actions">
              <a href="#how-it-works" className="l-btn-primary">📅 How to Book</a>
              <a href="#contact" className="l-btn-secondary">📞 Contact Us</a>
            </div>
            <div className="l-stats">
              <div><span className="l-stat-num">2+</span><span className="l-stat-label">Branches</span></div>
              <div><span className="l-stat-num">10+</span><span className="l-stat-label">Dentists</span></div>
              <div><span className="l-stat-num">2k+</span><span className="l-stat-label">Patients</span></div>
              <div><span className="l-stat-num">5★</span><span className="l-stat-label">Rating</span></div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="l-hero-visual">
            <div className="l-card" style={{position:'relative'}}>
              <div className="l-card-header">
                <div className="l-avatar">DS</div>
                <div>
                  <div style={{fontWeight:700,fontSize:'0.95rem'}}>Dr. Maria Santos</div>
                  <div style={{fontSize:'0.8rem',color:'#64748b'}}>General Dentistry · Main Branch</div>
                </div>
              </div>
              <p style={{fontSize:'0.82rem',color:'#64748b',marginBottom:'0.8rem',fontWeight:600}}>
                Available slots — Today
              </p>
              <div className="l-slot-grid">
                {slots.map((slot) => (
                  <div
                    key={slot.time}
                    className={`l-slot ${slot.status === 'taken' ? 'taken' : selectedSlot === slot.time ? 'selected' : 'available'}`}
                  >
                    {slot.time}
                  </div>
                ))}
              </div>
              <button className="l-confirm-btn">Confirm Appointment</button>

              <div className="l-float-badge b1">
                <div className="l-badge-dot" style={{background:'#10b981'}}/>
                Appointment Confirmed!
              </div>
              <div className="l-float-badge b2">
                🦷 No double booking guaranteed
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section className="l-section l-section-white" id="services">
          <div className="l-services-header">
            <div className="l-section-label">✦ What We Offer</div>
            <h2 className="l-section-title">Comprehensive Dental Services</h2>
            <p className="l-section-desc">From routine cleanings to advanced procedures, we cover all your dental needs under one roof.</p>
          </div>
          <div className="l-services-grid">
            {[
              {icon:'🦷', bg:'#e0f2fe', title:'General Checkup', desc:'Regular dental examinations to detect problems early and keep your teeth healthy year-round.'},
              {icon:'✨', bg:'#dcfce7', title:'Teeth Cleaning', desc:'Professional prophylaxis to remove plaque, tartar, and surface stains for a brighter smile.'},
              {icon:'🌟', bg:'#fef9c3', title:'Teeth Whitening', desc:'Safe and effective whitening treatments to restore your teeth\'s natural shine in one session.'},
              {icon:'🔧', bg:'#fce7f3', title:'Dental Fillings', desc:'Durable tooth-colored fillings that blend naturally with your teeth for seamless restoration.'},
              {icon:'👑', bg:'#ede9fe', title:'Dental Crowns', desc:'Custom-fitted crowns to restore broken or severely damaged teeth back to their original strength.'},
              {icon:'🦴', bg:'#ffedd5', title:'Tooth Extraction', desc:'Gentle and painless extractions performed by experienced dentists for problem teeth.'},
            ].map((s) => (
              <div key={s.title} className="l-service-card">
                <div className="l-service-icon" style={{background:s.bg}}>{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="l-section l-section-cream" id="how-it-works">
          <div className="l-how-grid">
            <div>
              <div className="l-section-label">✦ Booking Process</div>
              <h2 className="l-section-title">How to Get an Appointment</h2>
              <p className="l-section-desc" style={{marginBottom:'2.5rem'}}>
                Getting dental care at ILoveDentist is simple. Just follow these easy steps.
              </p>
              <div>
                {[
                  {num:'01', title:'Call or Visit the Clinic', desc:'Contact your nearest ILoveDentist branch by phone or visit us in person. Our friendly staff will assist you right away.'},
                  {num:'02', title:'Patient Registration', desc:'Our staff will register you as a patient. First-time visitors provide basic personal and medical information — only takes a few minutes.'},
                  {num:'03', title:'Choose Your Dentist & Schedule', desc:'Select your preferred branch, dentist, date, and available time slot. Our system shows only open slots — no double booking possible.'},
                  {num:'04', title:'Appointment Confirmed!', desc:'Your appointment is now booked. Simply arrive on time and our dentist will be ready for you. It\'s that easy!'},
                ].map((step) => (
                  <div key={step.num} className="l-step">
                    <span className="l-step-num">{step.num}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="l-how-visual">
              <div style={{background:'#e0f2fe',borderRadius:'16px',padding:'1.5rem',marginBottom:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                  <span style={{fontWeight:700,fontSize:'0.9rem'}}>📅 Select Time Slot</span>
                  <span style={{fontSize:'0.75rem',color:'#64748b',background:'white',padding:'0.3rem 0.6rem',borderRadius:'8px'}}>Mon, Mar 10</span>
                </div>
                <div className="l-mini-grid">
                  {[
                    {t:'9:00',c:'t'},{t:'9:30',c:'t'},{t:'10:00',c:'a'},{t:'10:30',c:'a'},
                    {t:'11:00',c:'s'},{t:'11:30',c:'a'},{t:'1:00',c:'t'},{t:'1:30',c:'a'},
                  ].map((s) => (
                    <div key={s.t} className={`l-mini-slot ${s.c}`}>{s.t}</div>
                  ))}
                </div>
              </div>
              <div className="l-confirm-strip">
                <div>
                  <p>Your appointment is confirmed</p>
                  <h4>Dr. Santos · 11:00 AM</h4>
                </div>
                <span style={{fontSize:'1.5rem'}}>✅</span>
              </div>
              <div style={{marginTop:'1.2rem',display:'flex',flexDirection:'column',gap:'0.6rem'}}>
                {['No double booking — slots updated in real-time','Choose any available dentist and branch','Your dental records are securely stored'].map((t) => (
                  <div key={t} style={{display:'flex',alignItems:'center',gap:'0.7rem',fontSize:'0.85rem',color:'#64748b'}}>
                    <span style={{color:'#10b981'}}>✓</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BRANCHES */}
        <section className="l-section l-section-white" id="branches">
          <div className="l-branches-header">
            <div>
              <div className="l-section-label">✦ Our Locations</div>
              <h2 className="l-section-title">Visit Us at Our Branches</h2>
            </div>
          </div>
          <div className="l-branches-grid">
            {[
              {
                name:'Main Branch', badge:'Main', badgeBg:'#e0f2fe', badgeColor:'#0369a1',
                mapBg:'linear-gradient(135deg,#e0f2fe,#dbeafe)',
                address:'123 Dental Street, Manila',
                phone:'+63 2 8123 4567', email:'main@ilovedentist.com',
                hours:'Mon–Sat · 9:00 AM – 6:00 PM',
              },
              {
                name:'North Branch', badge:'QC', badgeBg:'#dcfce7', badgeColor:'#065f46',
                mapBg:'linear-gradient(135deg,#dcfce7,#d1fae5)',
                address:'456 Tooth Avenue, Quezon City',
                phone:'+63 2 8765 4321', email:'north@ilovedentist.com',
                hours:'Mon–Sat · 9:00 AM – 6:00 PM',
              },
            ].map((b) => (
              <div key={b.name} className="l-branch-card">
                <div className="l-branch-map" style={{background:b.mapBg}}>📍</div>
                <div className="l-branch-info">
                  <div className="l-branch-name">
                    {b.name}
                    <span className="l-branch-badge" style={{background:b.badgeBg,color:b.badgeColor}}>{b.badge}</span>
                  </div>
                  {[{icon:'📌',text:b.address},{icon:'📞',text:b.phone},{icon:'📧',text:b.email},{icon:'🕐',text:b.hours}].map((d) => (
                    <div key={d.text} className="l-branch-detail">
                      <span>{d.icon}</span><span>{d.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* CTA Card */}
            <div style={{background:'#0ea5e9',borderRadius:'20px',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center',padding:'3rem 2rem',minHeight:'300px'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'1rem'}}>🦷</div>
              <h3 style={{color:'white',fontSize:'1.2rem',fontWeight:700,marginBottom:'0.8rem'}}>Ready to Book?</h3>
              <p style={{color:'rgba(255,255,255,0.8)',fontSize:'0.9rem',marginBottom:'1.5rem',lineHeight:1.6}}>
                Call or visit any of our branches today. Our staff will be happy to assist you.
              </p>
              <a href="#contact" style={{background:'white',color:'#0ea5e9',padding:'0.8rem 1.8rem',borderRadius:'50px',fontWeight:700,fontSize:'0.95rem'}}>
                📞 Contact Now
              </a>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="l-section l-section-dark" id="contact" style={{textAlign:'center',position:'relative',overflow:'hidden'}}>
          <div style={{position:'relative',zIndex:2}}>
            <div className="l-section-label" style={{justifyContent:'center',color:'rgba(14,165,233,0.8)'}}>✦ Get In Touch</div>
            <h2 className="l-section-title" style={{color:'white'}}>Ready for a Healthier Smile?</h2>
            <p className="l-section-desc" style={{color:'rgba(255,255,255,0.6)',margin:'0 auto 3rem'}}>
              Don&apos;t wait — your dental health matters. Contact us today to schedule your appointment.
            </p>
            <div className="l-contact-grid">
              {[
                {icon:'📞', title:'Call Us', main:'Main: +63 2 8123 4567', sub:'North: +63 2 8765 4321'},
                {icon:'📧', title:'Email Us', main:'main@ilovedentist.com', sub:'north@ilovedentist.com'},
                {icon:'🕐', title:'Clinic Hours', main:'Monday – Saturday', sub:'9:00 AM – 6:00 PM'},
                {icon:'📍', title:'Our Branches', main:'Manila · Quezon City', sub:'More branches coming soon'},
              ].map((c) => (
                <div key={c.title} className="l-contact-card">
                  <div style={{fontSize:'1.5rem',marginBottom:'0.8rem'}}>{c.icon}</div>
                  <h4>{c.title}</h4>
                  <p>{c.main}</p>
                  <p className="sub">{c.sub}</p>
                </div>
              ))}
            </div>
            <a href="#how-it-works" className="l-cta-big">
              📅 Learn How to Book an Appointment
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="l-footer">
          <p>© 2026 <strong style={{color:'rgba(255,255,255,0.7)'}}>ILoveDentist Clinic</strong>. All rights reserved. · Your Smile, Our Priority 🦷</p>
        </footer>
      </div>
    </>
  );
}