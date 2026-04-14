"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs tracking-widest uppercase text-black/40">{label}</p>
      <div className="divide-y divide-black/10 border border-black/10 rounded-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function NavLink({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-3 bg-white hover:bg-black/5 transition-colors group"
    >
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-black/40">{description}</p>
      </div>
      <span className="text-black/30 group-hover:text-black/60 transition-colors text-sm">→</span>
    </Link>
  );
}

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
    if (!heroRef.current || !logoRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    // Use gsap.context to ensure clean setup/teardown
    const ctx = gsap.context(() => {
      // Continuous rotation
      gsap.to(logoRef.current, {
        rotation: 360,
        duration: 8,
        ease: "linear",
        repeat: -1,
      });

      // Set initial states
      gsap.set(title1Ref.current, { scale: 0.067 });
      gsap.set([title2Ref.current, subtitleRef.current], {
        scale: 0,
        opacity: 0,
      });
      gsap.set(blackBgRef.current, { scale: 20 });

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

      tl.to(logoRef.current, { scale: 15, duration: 1, ease: "power2.in" })
        .to(
          blackBgRef.current,
          { scale: 1.5, duration: 1, ease: "power2.in" },
          "<",
        )
        .to(
          title1Ref.current,
          { scale: 1, duration: 1, ease: "power2.in" },
          "<",
        )
        .to(overlayRef.current, { opacity: 0, duration: 0.3 }, "-=0.2")
        .set(overlayRef.current, { display: "none" })
        .to(
          title2Ref.current,
          { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" },
          "-=0.1",
        )
        .to(
          subtitleRef.current,
          { scale: 1, opacity: 1, duration: 0.6, ease: "power3.out" },
          "-=0.3",
        );
    });

    return () => ctx.revert(); // This replaces the manual .kill() and is much safer
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
            A civic action platform for community impact.
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

      {/* App Navigation */}
      <section className="min-h-screen bg-white px-6 py-16">
        <div className="max-w-2xl mx-auto space-y-12">

          <div className="space-y-1">
            <p className="text-xs tracking-widest uppercase text-black/40">Platform</p>
            <h2 className="text-2xl font-semibold">Get started</h2>
          </div>

          <div className="space-y-6">
            <NavGroup label="Auth">
              <NavLink href="/register" title="Register" description="Create your account" />
              <NavLink href="/onboarding" title="Onboarding" description="3-step intro flow" />
            </NavGroup>

            <NavGroup label="Circles">
              <NavLink href="/circles" title="Circle list" description="Browse all circles" />
              <NavLink href="/circles/new" title="Create a Circle" description="Start a new circle" />
              <NavLink href="/circles/08d65cbb-ef6f-468e-96e8-dab74bc054cd" title="Circle detail" description="Diepkloof Guardians (seed)" />
            </NavGroup>

            <NavGroup label="Challenges">
              <NavLink href="/challenges" title="Challenge library" description="Browse all challenges" />
              <NavLink href="/challenges/f44a537f-da1d-4321-82ce-1a7139a4a609" title="Challenge detail" description="Newland West Land Care (seed)" />
            </NavGroup>

            <NavGroup label="Reports">
              <NavLink
                href="/reports/new?challengeId=f44a537f-da1d-4321-82ce-1a7139a4a609"
                title="Submit a Report"
                description="Report form for Newland West Land Care"
              />
            </NavGroup>

            <NavGroup label="Admin">
              <NavLink href="/admin/queue" title="Admin queue" description="Pending L2 report review" />
            </NavGroup>

            <NavGroup label="Dev">
              <NavLink href="/api" title="API overview" description="Live JSON from all endpoints" />
            </NavGroup>
          </div>
        </div>
      </section>
    </main>
  );
}
