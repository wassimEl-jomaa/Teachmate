import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export default function Header({ signedIn, setSignedIn, role }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = () => {
    setSignedIn(false);
    localStorage.removeItem("token");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);

  const linkBase =
    "inline-flex items-center rounded-lg px-4 py-2 text-sm md:text-base font-semibold transition-all";
  const linkPrimary =
    "bg-blue-500 text-white hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300";
  const linkGhost =
    "text-blue-900/90 hover:text-blue-900 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200";

  const navLinkClass = ({ isActive }) =>
    `${linkBase} ${isActive ? "bg-white/70 text-blue-900" : "text-blue-900/90 hover:bg-white/60"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-blue-200/70 bg-blue-100/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        {/* Left: Logo + Desktop Nav */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
          <img
              src="/TeachMate_logo.png"
              alt="TeachMate Logo"
              className="h-14 md:h-16 w-auto object-contain"
            />
            
          </Link>

          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/aboutUs" className={navLinkClass}>
              About Us
            </NavLink>

            {/* Role links in nav (desktop) */}
            {signedIn && role === "Admin" && (
              <NavLink to="/admin" className={navLinkClass}>
                Admin
              </NavLink>
            )}
            {signedIn && role === "Teacher" && (
              <NavLink to="/teacher" className={navLinkClass}>
                Teacher
              </NavLink>
            )}
          </div>
        </div>

        {/* Right: Actions (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {!signedIn ? (
            <>
              <Link to="/login" className={`${linkBase} ${linkGhost}`}>
                Sign in
              </Link>
              <Link to="/register" className={`${linkBase} ${linkPrimary}`}>
                Register
              </Link>
            </>
          ) : (
            <>
              <Link to="/Profil" className={`${linkBase} ${linkGhost}`}>
                Profile
              </Link>
              <Link to="/" onClick={logout} className={`${linkBase} ${linkPrimary}`}>
                Sign out
              </Link>
            </>
          )}
        </div>

        {/* Mobile: Menu button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-blue-900 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-200"
          aria-label="Open menu"
          aria-expanded={isMobileMenuOpen}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12h18M3 6h18M3 18h18"></path>
          </svg>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-blue-200/70 bg-blue-100/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4 space-y-2">
            <NavLink to="/" onClick={() => setIsMobileMenuOpen(false)} className={navLinkClass}>
              Home
            </NavLink>
            <NavLink
              to="/aboutUs"
              onClick={() => setIsMobileMenuOpen(false)}
              className={navLinkClass}
            >
              About Us
            </NavLink>

            {/* Role links in mobile */}
            {signedIn && role === "Admin" && (
              <NavLink
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Admin
              </NavLink>
            )}
            {signedIn && role === "Teacher" && (
              <NavLink
                to="/teacher"
                onClick={() => setIsMobileMenuOpen(false)}
                className={navLinkClass}
              >
                Teacher
              </NavLink>
            )}

            <div className="pt-2 mt-2 border-t border-blue-200/70 space-y-2">
              {!signedIn ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${linkBase} ${linkGhost} w-full justify-center`}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${linkBase} ${linkPrimary} w-full justify-center`}
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/Profil"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`${linkBase} ${linkGhost} w-full justify-center`}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/"
                    onClick={logout}
                    className={`${linkBase} ${linkPrimary} w-full justify-center`}
                  >
                    Sign out
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
