import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HeroDivider from './components/HeroDivider';
import TrustBar from './components/TrustBar';
import Rooms from './components/Rooms';
import Features from './components/Features';
import Location from './components/Location';
import Reviews from './components/Reviews';
import Amenities from './components/Amenities';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main>
        <Hero />
        <HeroDivider />
        <TrustBar />
        <Rooms />
        <Features />
        <Location />
        <Reviews />
        <Amenities />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
