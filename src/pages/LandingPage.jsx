import React from 'react';
import { Header } from '../components/layout/Header';
import { HeroSection } from '../features/landing/HeroSection';
import { AboutSection } from '../features/landing/AboutSection';
import { AmenitiesSection } from '../features/landing/AmenitiesSection';
import { SeatMap } from '../features/seats/SeatMap';
import { PricingSection } from '../features/landing/PricingSection';
import { FaqSection } from '../features/landing/FaqSection';
import { Footer } from '../components/layout/Footer';

export const LandingPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <HeroSection />
        <AboutSection />
        <AmenitiesSection />
        <SeatMap />
        <PricingSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
};
