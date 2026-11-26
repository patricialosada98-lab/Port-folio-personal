import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavLinkItem {
  label: string;
  href: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Perfil', href: '#perfil' },
  { label: 'Experiencia', href: '#experiencia' },
  { label: 'Competencias', href: '#competencias' },
  { label: 'Formación', href: '#formacion' },
  { label: 'Contacto', href: '#contacto' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#inicio"
          onClick={handleNavClick}
          className="font-display text-lg font-bold tracking-tight text-[#0F2342] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284C7] rounded-sm"
        >
          Olga Posada
        </a>

        {/* Zone 2: Concise single-line desktop navigation links */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#333C48] hover:text-[#0369A1] border-b-2 border-transparent hover:border-[#0284C7] py-1 transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0284C7] rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Single primary action (desktop) + mobile hamburger */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="#contacto"
            className="hidden md:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-[#0F2342] hover:bg-[#163159] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0284C7]"
          >
            Solicitar entrevista
          </a>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
            aria-label={mobileOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            className="md:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-md text-[#0F2342] hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#0284C7]"
          >
            {mobileOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <nav
          id="mobile-navigation-drawer"
          aria-label="Menú móvil"
          className="md:hidden bg-white border-b border-slate-200 px-4 py-4 shadow-sm"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={handleNavClick}
                  className="flex items-center min-h-[44px] px-3 rounded-md text-base font-medium text-[#1E242B] hover:bg-[#F4F6F9] hover:text-[#0F2342] transition-colors"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-2 mt-2 border-t border-slate-200">
              <a
                href="#contacto"
                onClick={handleNavClick}
                className="flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-md text-sm font-semibold text-white bg-[#0F2342] hover:bg-[#163159] transition-colors"
              >
                Solicitar entrevista
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
