"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

export default function Home() {
  const heroRef = useRef(null);
  const overlayRef = useRef(null);
  const blackBgRef = useRef(null);
  const logoRef = useRef(null);
  const title1Ref = useRef(null);
  const title2Ref = useRef(null);
  const subtitleRef = useRef(null);
  const eyebrowRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Continuous rotation for the logo
    gsap.to(logoRef.current, {
      rotation: 360,
      duration: 8,
      ease: "linear",
      repeat: -1,
    });

    // Set initial states
    gsap.set([eyebrowRef.current, title1Ref.current], { scale: 0.067 });
    gsap.set([title2Ref.current, subtitleRef.current], {
      scale: 0,
      opacity: 0,
    });
    gsap.set(blackBgRef.current, { scale: 20 });

    // Intro Reveal Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "+=150%",
        scrub: 1,
        pin: true,
        pinSpacing: true,
      },
    });

    tl.to(logoRef.current, {
      scale: 15,
      duration: 1,
      ease: "power2.in",
    })
      .to(
        blackBgRef.current,
        {
          scale: 1.5,
          duration: 1,
          ease: "power2.in",
        },
        "<",
      )
      .to(
        [eyebrowRef.current, title1Ref.current],
        {
          scale: 1,
          duration: 1,
          ease: "power2.in",
        },
        "<",
      )
      .to(
        overlayRef.current,
        {
          opacity: 0,
          duration: 0.3,
        },
        "-=0.2",
      )
      .set(overlayRef.current, { display: "none" })
      .to(
        title2Ref.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
        },
        "-=0.1",
      )
      .to(
        subtitleRef.current,
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
        },
        "-=0.3",
      );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section ref={heroRef} className="hero-section">
        <div className="hero-content">
          {/* <p ref={eyebrowRef} className="hero-eyebrow">
            Platform Pilot · March 2026
          </p> */}
          <h1 className="hero-title flex gap-4">
            <span ref={title1Ref} className="hero-title-line">
              Guardians
            </span>
            <span ref={title2Ref} className="hero-title-line hero-title-em">
              of the Future
            </span>
          </h1>
          <p
            ref={subtitleRef}
            className="hero-subtitle text-black/50 text-center mt-8 italic"
          >
            WORK IN PROGRESS ...
          </p>
        </div>
      </section>

      {/* Intro Overlay */}
      <div ref={overlayRef} className="intro-overlay">
        <div ref={blackBgRef} className="intro-black-bg"></div>
        <div className="logo-container">
          <img
            ref={logoRef}
            src="/images/Guardians Logo-logo-white.png"
            alt="Guardians Logo"
            className="rotating-logo"
          />
        </div>
      </div>

      {/* Placeholder for subsequent content to allow scrolling */}
      {/* <section style={{ height: "100vh", background: "#003518" }}></section> */}
    </main>
  );
}
