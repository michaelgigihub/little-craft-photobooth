import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";
import { PhotoProvider } from "../context/PhotoContext";
import "../assets/css/navbar.css";

export const Route = createRootRoute({
  component: () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
      setMenuOpen(!menuOpen);
    };

    // Close menu when a link is clicked
    const handleLinkClick = () => {
      setMenuOpen(false);
    };

    // Add effect to handle active class
    useEffect(() => {
      const updateActiveLink = () => {
        document.querySelectorAll(".nav-link").forEach((link) => {
          const linkPath = link.getAttribute("href");
          const currentPath = window.location.pathname;

          if (
            linkPath === currentPath ||
            (linkPath === "/" && currentPath === "/") ||
            (currentPath.startsWith(linkPath) && linkPath !== "/")
          ) {
            link.classList.add("active");
          } else {
            link.classList.remove("active");
          }
        });
      };

      updateActiveLink();

      // For client-side navigation
      const observer = new MutationObserver(() => {
        updateActiveLink();
      });

      observer.observe(document.body, { subtree: true, childList: true });

      return () => observer.disconnect();
    }, []);

    return (
      <PhotoProvider>
        <div className="nav-container">
          <div className="menu-container">
            <div
              className={`hamburger ${menuOpen ? "active" : ""}`}
              onClick={toggleMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <nav className={`navbar ${menuOpen ? "active" : ""}`}>
            <Link to="/" className="nav-link" onClick={handleLinkClick}>
              Photobooth
            </Link>
            <Link to="/about" className="nav-link" onClick={handleLinkClick}>
              About
            </Link>
            <Link
              to="/privacy-policy"
              className="nav-link"
              onClick={handleLinkClick}
            >
              Privacy Policy
            </Link>
            <Link to="/faq" className="nav-link" onClick={handleLinkClick}>
              FAQ
            </Link>
          </nav>
        </div>
        <div className="content-container">
          <Outlet />
        </div>
        <TanStackRouterDevtools />
      </PhotoProvider>
    );
  },
});
