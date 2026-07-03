'use client'

import { useRef, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import styles from './Navbar.module.css'

const NAV_LINKS = ['Locations', 'Rooms', 'Experiences', 'Contact']

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const tlRef = useRef(null)
  const hoverTlRef = useRef(null)
  const barTopRef = useRef(null)
  const barBotRef = useRef(null)
  const barMidRef = useRef(null)
  const hamburgerRef = useRef(null)

  useLayoutEffect(() => {
    tlRef.current = gsap.timeline()
    hoverTlRef.current = gsap.timeline({ paused: true })
    return () => {
      tlRef.current?.kill()
      hoverTlRef.current?.kill()
    }
  }, [])

  function openMenu() {
    const tl = tlRef.current

    tl.set('.js-nav', { visibility: 'visible', pointerEvents: 'auto' })
      // backdrop fade
      .fromTo(
        '.js-nav-bg',
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: 'power2.out' },
        0
      )
      // three panels slide in from the right, staggered
      .fromTo(
        '.js-nav-panel',
        { x: '101%', rotation: 0 },
        { x: '0%', duration: 0.6, ease: 'back.out', stagger: 0.2 },
        0
      )
      // link list + socials stagger in
      .fromTo(
        '.js-nav-item',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 1, ease: 'expo.out', stagger: 0.04 },
        0.15
      )
      // hamburger top bar -> X
      .fromTo(
        barTopRef.current,
        { attr: { x1: 3, y1: 7, x2: 17, y2: 7 } },
        {
          attr: { x1: 5, y1: 5, x2: 15, y2: 15 },
          stroke: '#fff',
          duration: 0.35,
          ease: 'back.out(1.4)',
        },
        0.06
      )
      // middle bar fades out
      .to(
        barMidRef.current,
        { opacity: 0, duration: 0.2, ease: 'power2.out' },
        0.06
      )
      // hamburger bottom bar -> X
      .fromTo(
        barBotRef.current,
        { attr: { x1: 3, y1: 13, x2: 17, y2: 13 } },
        {
          attr: { x1: 15, y1: 5, x2: 5, y2: 15 },
          stroke: '#fff',
          duration: 0.35,
          ease: 'back.out(1.4)',
        },
        0.06
      )
      // meta row / CTA fade-up last
      .fromTo(
        '.js-nav-meta',
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' },
        0.4
      )
  }

  function closeMenu() {
    const tl = tlRef.current

    tl.to(barMidRef.current, { opacity: 1, duration: 0.15 }, 0)
      .to(
        barTopRef.current,
        { attr: { x1: 3, y1: 7, x2: 17, y2: 7 }, duration: 0.2, ease: 'power3.in' },
        0
      )
      .to(
        barBotRef.current,
        { attr: { x1: 3, y1: 13, x2: 17, y2: 13 }, duration: 0.2, ease: 'power3.in' },
        0
      )
      // panels drop off, staggered from the end, slight random rotation
      .to(
        '.js-nav-panel',
        {
          y: '160vh',
          rotation: 'random(-15, 15)',
          duration: 0.9,
          ease: 'power3.in',
          stagger: { from: 'end', each: 0.05 },
        },
        0
      )
      // backdrop fades shortly after panels start falling
      .to('.js-nav-bg', { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1)
      // wait for the panel fall (longest tween) to fully finish before hiding/resetting,
      // using an explicit absolute time so it never races the tweens above
      .set('.js-nav', { visibility: 'hidden', pointerEvents: 'none' }, 1)
      .set('.js-nav-panel', { y: 0, rotation: 0 }, 1)
  }

  function toggleMenu() {
    const next = !isOpen
    setIsOpen(next)

    const tl = tlRef.current
    tl.clear()
    tl.time(0, false) // reset playhead so newly-added tweens always play from the start
    if (next) {
      openMenu()
    } else {
      closeMenu()
    }
  }

  function closeIfOpen() {
    if (isOpen) toggleMenu()
  }

  function handleHoverEnter() {
    setIsHovered(true)
    const htl = hoverTlRef.current
    htl.clear()
    
    // Smooth hamburger to cross on hover
    htl.to(
      barTopRef.current,
      {
        attr: { x1: 5, y1: 5, x2: 15, y2: 15 },
        duration: 0.4,
        ease: 'back.out(1.2)',
      },
      0
    )
    htl.to(
      barMidRef.current,
      {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.out',
      },
      0
    )
    htl.to(
      barBotRef.current,
      {
        attr: { x1: 15, y1: 5, x2: 5, y2: 15 },
        duration: 0.4,
        ease: 'back.out(1.2)',
      },
      0
    )
    
    htl.play()
  }

  function handleHoverLeave() {
    if (!isOpen) {
      setIsHovered(false)
      const htl = hoverTlRef.current
      htl.reverse()
    }
  }

  return (
    <header className={styles.navbar}>
      <a className={styles.brand} href="#top">
        <svg
          className={styles.brandMark}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z"
            fill="#f5b75c"
          />
        </svg>
        WoodNest
      </a>

      {/* Desktop links, hidden under 541px via CSS if you want a breakpoint —
          left as-is from your original markup, shown alongside the hamburger */}
      {/* <nav className={styles.links} aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <a key={link} href={`#${link.toLowerCase()}`}>
            {link}
          </a>
        ))}
      </nav> */}

      <button
        ref={hamburgerRef}
        type="button"
        className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ''}`}
        onClick={toggleMenu}
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <svg viewBox="0 0 20 20" fill="none">
          <line
            ref={barTopRef}
            className={styles.bar}
            x1="3"
            y1="7"
            x2="17"
            y2="7"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            ref={barMidRef}
            className={styles.bar}
            x1="3"
            y1="10"
            x2="17"
            y2="10"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            ref={barBotRef}
            className={styles.bar}
            x1="3"
            y1="13"
            x2="17"
            y2="13"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* ── Overlay: built once, toggled via GSAP visibility/pointerEvents,
          never unmounted, so the timeline always has the same DOM to target ── */}
      <div className={`js-nav ${styles.nav}`}>
        <div
          className={`js-nav-bg ${styles.navBg}`}
          onClick={closeIfOpen}
          aria-hidden="true"
        />

        {/* Top panel — paper, link list */}
        <div className={`js-nav-panel ${styles.navPanel} ${styles.navTop}`}>
          <ul className={styles.navList}>
            {NAV_LINKS.map((link) => (
              <li key={link} className={`js-nav-item ${styles.navItem}`}>
                <a
                  href={`#${link.toLowerCase()}`}
                  className={styles.navLink}
                  onClick={closeIfOpen}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
          <div className={`js-nav-meta ${styles.navMeta}`}>
            Open daily, 9am&ndash;6pm &middot; (555) 014&ndash;2200
          </div>
        </div>

        {/* Middle panel — gold, signature availability card */}
        <div className={`js-nav-panel ${styles.navPanel} ${styles.navMiddle}`}>
          <div className={styles.navMiddleHeader}>Right Now</div>
          <div className={styles.navMiddleCard}>
            <div className={styles.navMiddleBadge}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            </div>
            <div className={styles.navMiddleInfo}>
              <div className={styles.navMiddleTitle}>3 cabins open this weekend</div>
              <div className={styles.navMiddleDesc}>
                Riverside Loft, the Pinery, and Hollow Creek are free Fri&ndash;Sun.
              </div>
            </div>
          </div>
          <div className={styles.navMiddleActions}>
            <button type="button" onClick={closeIfOpen}>
              Check Availability
            </button>
          </div>
        </div>

        {/* Bottom panel — dark, CTA + socials */}
        <div className={`js-nav-panel ${styles.navPanel} ${styles.navBottom}`}>
          <ul className={styles.navSocials}>
            <li>
              <a href="#" tabIndex={isOpen ? 0 : -1}>
                Instagram
              </a>
            </li>
            <li>
              <a href="#" tabIndex={isOpen ? 0 : -1}>
                Pinterest
              </a>
            </li>
          </ul>
          <button
            type="button"
            className={styles.navCta}
            onClick={closeIfOpen}
            tabIndex={isOpen ? 0 : -1}
          >
            Book Now
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
