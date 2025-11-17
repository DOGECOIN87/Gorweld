import React, { useState } from 'react';
import { Hero } from './components/Hero';
import { ProjectsSection } from './components/ProjectsSection';
import { NetworkInfo } from './components/NetworkInfo';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');

  return (
    <div className="min-h-screen bg-[#050608] text-white">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      <Hero />
      <ProjectsSection />
      <NetworkInfo />
      <Footer />
    </div>
  );
};
