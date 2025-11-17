import React from 'react';

interface HeaderProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeSection, setActiveSection }) => {
  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'network', label: 'Network' },
    { id: 'docs', label: 'Docs', external: 'https://docs.gorbagana.wtf/' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050608]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <img 
              src="/Gorweld-Logo.png" 
              alt="Gorweld Logo" 
              className="h-8 w-auto drop-shadow-[0_0_10px_rgba(110,255,139,0.3)] hover:drop-shadow-[0_0_20px_rgba(110,255,139,0.5)] transition-all"
            />
            <span className="text-xl font-bold tracking-wide">GORWELD</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.id}
                  href={item.external}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-400 hover:text-[#33ff99] transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.id ? 'text-[#33ff99]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
