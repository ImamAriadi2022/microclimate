import React from 'react';
import Hero from '../components/Hero';
import CustomNavbar from '../components/Navbar';
import Category from '../components/Category';
import CoreFitur from '../components/Core-Fitur';
import CardFitur from '../components/CardFitur';
import Alat from '../components/Alat';
import Launch from '../components/Launch';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import ScrollToTopButton from '../components/button';

const Home = () => {
  return (
    <>
        {/* Navbar */}
        <CustomNavbar />

        {/* Hero Section */}
        <Hero />

        {/* Category Section */}
        <Category />

        {/* Core Fitur Section */}
        <CoreFitur />

        {/* Card Fitur Section */}
        <CardFitur />

        {/* Alat Section */}
        <Alat />

        {/* Launch Section */}
        <Launch />

        {/* FAQ Section */}
        <FAQ />

        {/* Footer */}
        <Footer />

        {/* Scroll to Top Button */}
        <ScrollToTopButton />
    </>
  );
};

export default Home;