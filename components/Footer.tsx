'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from "motion/react";
import { Icon } from "@iconify/react";
import Logo from './Logo';

const footerSocials = [
  { href: '#', label: 'Twitter',   icon: 'ri:twitter-x-fill' },
  { href: '#', label: 'LinkedIn',  icon: 'ri:linkedin-fill' },
  { href: '#', label: 'YouTube',   icon: 'ri:youtube-fill' },
  { href: '#', label: 'Instagram', icon: 'ri:instagram-line' },
  { href: '#', label: 'Discord',   icon: 'ri:discord-fill' },
]

const footerSponsors = [
  { name: 'Razer',       src: '/images/logos/razer.svg',      width: 80, height: 20 },
  { name: 'SteelSeries', src: '/images/logos/steelseries.svg', width: 80, height: 22 },
  { name: 'HyperX',      src: '/images/logos/hyperx.svg',     width: 70, height: 20 },
  { name: 'Corsair',     src: '/images/logos/corsair.svg',    width: 70, height: 22 },
  { name: 'Elgato',      src: '/images/logos/elgato.svg',     width: 70, height: 20 },
]

export default function Footer() {
  return (
    <footer className="footer-modern">
      <style dangerouslySetInnerHTML={{__html: `
        .footer-modern {
          position: relative;
          background: #09090b;
          border-top: 1px solid rgba(255,255,255,0.03);
          overflow: hidden;
          padding-top: 80px;
          margin-top: 80px;
        }
        
        .footer-modern::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232,0,13,0.6), transparent);
          box-shadow: 0 0 20px rgba(232,0,13,0.5);
        }

        .footer-modern-grid-bg {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(ellipse at top, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at top, black 30%, transparent 80%);
          pointer-events: none;
        }

        .footer-glow {
          position: absolute;
          top: -200px;
          left: 50%;
          transform: translateX(-50%);
          width: 1000px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(232,0,13,0.12) 0%, transparent 70%);
          pointer-events: none;
          filter: blur(50px);
          border-radius: 50%;
        }

        .sponsor-glass-bar {
          background: rgba(20, 20, 25, 0.4);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 24px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
          margin-bottom: 70px;
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
        }
        
        .sponsor-label-modern {
          font-family: 'Rajdhani', sans-serif;
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.25em;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
        }

        .sponsor-logos-modern {
          display: flex;
          align-items: center;
          gap: 40px;
          flex-wrap: wrap;
        }

        .sponsor-slot-modern {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sponsor-slot-modern img {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.3;
          filter: grayscale(100%);
        }
        .sponsor-slot-modern:hover img {
          opacity: 1;
          filter: grayscale(0%);
          transform: scale(1.1) translateY(-2px);
        }

        .footer-modern-content {
          display: grid;
          grid-template-columns: 1.2fr 2fr;
          gap: 80px;
          position: relative;
          z-index: 10;
          padding-bottom: 60px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .footer-modern-brand h2 {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 34px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          letter-spacing: 0.02em;
        }

        .footer-modern-desc {
          font-size: 14px;
          color: #9CA3AF;
          line-height: 1.8;
          max-width: 380px;
          margin-bottom: 28px;
        }

        .social-circle-btn {
          width: 42px; height: 42px;
          border-radius: 50%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: #9CA3AF;
          font-size: 18px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        
        .social-circle-btn::before {
          content: '';
          position: absolute; inset: 0;
          background: var(--red);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .social-circle-btn:hover {
          color: #fff;
          border-color: rgba(232,0,13,0.5);
          transform: translateY(-4px);
          box-shadow: 0 10px 20px -5px rgba(232,0,13,0.4);
        }

        .social-circle-btn:hover::before {
          opacity: 0.15;
        }

        .footer-modern-links-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }

        .footer-modern-col h4 {
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #fff;
          text-transform: uppercase;
          margin-bottom: 28px;
          position: relative;
          display: inline-block;
        }
        
        .footer-modern-col h4::after {
          content: ''; position: absolute;
          bottom: -8px; left: 0; width: 20px; height: 2px;
          background: var(--red);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        .footer-modern-col:hover h4::after {
          width: 100%;
        }

        .footer-modern-link {
          display: block;
          color: #9CA3AF;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          width: fit-content;
        }
        
        .footer-modern-link:hover {
          color: #fff;
          transform: translateX(6px);
          text-shadow: 0 0 12px rgba(255,255,255,0.4);
        }

        .footer-modern-bottom {
          padding: 28px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #6B7280;
          position: relative;
          z-index: 10;
        }
        
        .footer-modern-bottom-links {
          display: flex; gap: 32px;
        }
        
        .footer-modern-bottom-links a {
          color: #6B7280; 
          text-decoration: none; 
          transition: color 0.2s ease;
          font-weight: 500;
        }
        .footer-modern-bottom-links a:hover { color: #fff; }

        @media (max-width: 1024px) {
          .footer-modern-content { grid-template-columns: 1fr; gap: 50px; }
          .footer-modern-desc { max-width: 100%; }
        }
        @media (max-width: 768px) {
          .sponsor-glass-bar { flex-direction: column; align-items: flex-start; gap: 16px; padding: 20px; }
          .footer-modern-bottom { flex-direction: column; gap: 16px; align-items: flex-start; }
          .footer-modern-links-grid { grid-template-columns: 1fr 1fr; gap: 30px; }
        }
        @media (max-width: 480px) {
          .footer-modern-links-grid { grid-template-columns: 1fr; }
        }
      `}} />
      
      <div className="footer-modern-grid-bg" />
      <div className="footer-glow" />

      <div className="container" style={{ position: 'relative' }}>
        <motion.div 
          className="sponsor-glass-bar"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="sponsor-label-modern">Trusted Partners</span>
          <div className="sponsor-logos-modern">
            {footerSponsors.map((s, idx) => (
              <motion.div 
                key={s.name} 
                className="sponsor-slot-modern" 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1, duration: 0.5 }}
              >
                <Image src={s.src} alt={s.name} width={s.width} height={s.height} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="footer-modern-content">
          <motion.div 
            className="footer-modern-brand"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <Logo className="mb-4!" />
            <p className="footer-modern-desc">
              The premier destination for competitive gaming. Engage in wager matches, epic tournaments, premium coaching, and climb the ladder across the biggest titles in esports.
            </p>
            <div style={{ display: 'flex', gap: 14 }}>
              {footerSocials.map((social, idx) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="social-circle-btn"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + idx * 0.1, duration: 0.4 }}
                >
                  <Icon icon={social.icon} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          <motion.div 
            className="footer-modern-links-grid"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="footer-modern-col">
              <h4>Compete</h4>
              <div>
                <Link href="/tournaments"  className="footer-modern-link">Tournaments</Link>
                <Link href="/games"        className="footer-modern-link">Games</Link>
                <Link href="/leaderboards" className="footer-modern-link">Leaderboards</Link>
                <Link href="/coaching"     className="footer-modern-link">Coaching</Link>
                <Link href="/store"        className="footer-modern-link">Store</Link>
              </div>
            </div>
            <div className="footer-modern-col">
              <h4>Support</h4>
              <div>
                <Link href="/dashboard?tab=tickets" className="footer-modern-link">Ticket Center</Link>
                <Link href="/rules"                 className="footer-modern-link">FAQ</Link>
                <Link href="/rules"                 className="footer-modern-link">Rules & Legal</Link>
                <Link href="/contact"               className="footer-modern-link">Contact Us</Link>
              </div>
            </div>
            <div className="footer-modern-col">
              <h4>Company</h4>
              <div>
                <Link href="/about"   className="footer-modern-link">About Us</Link>
                <Link href="/contact" className="footer-modern-link">Press & Media</Link>
                <Link href="/rules"   className="footer-modern-link">Privacy Policy</Link>
                <Link href="/rules"   className="footer-modern-link">Terms of Service</Link>
                <Link href="/contact" className="footer-modern-link">Advertise With Us</Link>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="footer-modern-bottom"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div>
            © {new Date().getFullYear()} GamerHead LLC. All rights reserved. <br/>
            <span style={{ fontSize: '11px', color: '#4B5563', marginTop: '6px', display: 'block' }}>
              All game titles, trade names and associated imagery are trademarks of their respective owners.
            </span>
          </div>
          <div className="footer-modern-bottom-links">
            <Link href="/rules">Privacy</Link>
            <Link href="/rules">Terms</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
