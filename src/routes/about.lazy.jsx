import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import {
  Building2,
  Palette,
  Heart,
  ArrowRight,
  FileText,
  Gift,
  Shield,
  Layout,
  Printer,
  MoreHorizontal,
} from "lucide-react";
import "../assets/css/about.css";
import "../assets/css/gallery.css";
import "../assets/css/animations.css";
import "../assets/css/vertical-nav.css";

// Import gallery images
import galleryImg1 from "../assets/images/about-us-photos/490709330_1113258014148156_5262548791151562247_n.jpg";
import galleryImg2 from "../assets/images/about-us-photos/495181339_1131879442286013_8309219204103813069_n.jpg";
import galleryImg3 from "../assets/images/about-us-photos/502585816_1150731307067493_2462799931433276513_n.jpg";
import galleryImg4 from "../assets/images/about-us-photos/504094795_1154026570071300_4125193761828405590_n.jpg";
import galleryImg5 from "../assets/images/about-us-photos/505392339_1158698766270747_7954774798331590940_n.jpg";
import galleryImg6 from "../assets/images/about-us-photos/506227741_1160773712729919_3936589412809733155_n.jpg";

export const Route = createLazyFileRoute("/about")({
  component: About,
});

function About() {
  // Create refs for sections we want to observe
  const sectionRefs = useRef([]);
  const [activeSection, setActiveSection] = useState("about");

  // Navigation items configuration
  const navigationItems = [
    { id: "about", label: "About Us" },
    { id: "services", label: "Services Offered" },
    { id: "gallery", label: "Our Works" },
    { id: "story", label: "Our Story" },
    { id: "footer", label: "Contact" },
  ];

  useEffect(() => {
    // Set up intersection observer for animations
    const animationOptions = {
      root: null, // viewport
      rootMargin: "100px 0px 100px 0px", // trigger when element is 100px away from entering viewport (very early)
      threshold: 0.1, // trigger as soon as any part of the element is visible
    };

    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add the visible class when element comes into view
          entry.target.classList.add("is-visible");
          // Once the animation has played, unobserve the element
          animationObserver.unobserve(entry.target);
        }
      });
    }, animationOptions);

    // Set up intersection observer for navigation tracking (separate observer)
    const navOptions = {
      root: null,
      rootMargin: "0px 0px -50% 0px", // Trigger when section is at least 50% in viewport
      threshold: 0.1, // Lower threshold for better detection
    };

    const navObserver = new IntersectionObserver((entries) => {
      // Create a map of all currently intersecting sections
      const intersectingSections = new Map();

      entries.forEach((entry) => {
        const sectionId = entry.target.getAttribute("data-section");
        if (entry.isIntersecting && sectionId) {
          intersectingSections.set(sectionId, {
            ratio: entry.intersectionRatio,
            element: entry.target,
          });
        }
      });

      // If we have intersecting sections, find the most visible one
      if (intersectingSections.size > 0) {
        let mostVisibleSection = null;
        let highestRatio = 0;

        intersectingSections.forEach((data, sectionId) => {
          if (data.ratio > highestRatio) {
            highestRatio = data.ratio;
            mostVisibleSection = sectionId;
          }
        });

        if (mostVisibleSection) {
          setActiveSection(mostVisibleSection);
        }
      }
    }, navOptions);

    // Get all sections with the fade-in-section class and observe them
    const sections = document.querySelectorAll(".fade-in-section");
    sections.forEach((section) => {
      animationObserver.observe(section);
      navObserver.observe(section); // Observe with both observers
      sectionRefs.current.push(section);
    });

    // Clean up
    return () => {
      if (sectionRefs.current.length > 0) {
        sectionRefs.current.forEach((section) => {
          if (section) {
            animationObserver.unobserve(section);
            navObserver.unobserve(section);
          }
        });
      }
    };
  }, []); // Run once on mount

  // Function to scroll to a specific section
  const scrollToSection = (sectionId) => {
    // Immediately update the active section for instant feedback
    setActiveSection(sectionId);

    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
  };

  return (
    <div className="page-container">
      {/* Vertical Navigation */}
      <nav className="vertical-nav">
        {navigationItems.map((item) => (
          <div
            key={item.id}
            className={`nav-dot ${activeSection === item.id ? "active" : ""}`}
            onClick={() => scrollToSection(item.id)}
          >
            <div className="nav-label">{item.label}</div>
          </div>
        ))}
      </nav>

      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <h1 className="about-title">Little Crafts by WRT</h1>
          <p className="about-subtitle">
            Made by hand, lend by grace. 
          </p>
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* About Us Section */}
          <div className="about-section fade-in-section" data-section="about">
            <h2 className="section-title">
              <Building2 className="section-icon" size={32} />
              About Us
            </h2>
            <div className="section-content">
              <p>
                At Little Crafts by WRT, creativity meets craftsmanship.
              </p>
              <p>
                We focus on quality and customer satisfaction, making sure each
                product reflects our clients' needs and ideas. Whether you're
                planning a special event, launching a business, or simply
                looking to create something meaningful, Little Crafts by WRT is
                here to help bring your vision to life.
              </p>

              <p>
                <em>Based in Philippines 🇵🇭 {"–"} we ship nationwide!</em>
              </p>
            </div>
          </div>

          {/* Services Offered Section */}
          <div
            className="about-section fade-in-section"
            data-section="services"
          >
            <h2 className="section-title">
              <Palette className="section-icon" size={32} />
              Services Offered
            </h2>
            <div className="section-content">
              <p>
                We are a dedicated arts and crafts studio offering a diverse
                range of services designed to bring your ideas to life.
              </p>

              <div className="services-grid">
                <div className="service-item">
                  <FileText className="service-icon" size={40} />
                  <h3 className="service-title">
                    Digital & Physical Invitations
                  </h3>
                  <p className="service-description">
                    Custom-designed invitations for weddings, birthdays,
                    corporate events, and special occasions
                  </p>
                </div>
                <div className="service-item">
                  <Gift className="service-icon" size={40} />
                  <h3 className="service-title">Souvenirs</h3>
                  <p className="service-description">
                    Personalized keepsakes and memorable gifts for any
                    celebration or milestone
                  </p>
                </div>
                <div className="service-item">
                  <Shield className="service-icon" size={40} />
                  <h3 className="service-title">Lamination</h3>
                  <p className="service-description">
                    Professional lamination services to preserve and protect
                    your important documents
                  </p>
                </div>
                <div className="service-item">
                  <Layout className="service-icon" size={40} />
                  <h3 className="service-title">Digital Layout</h3>
                  <p className="service-description">
                    Creative digital designs for marketing materials,
                    presentations, and publications
                  </p>
                </div>
                <div className="service-item">
                  <Printer className="service-icon" size={40} />
                  <h3 className="service-title">Printing Service</h3>
                  <p className="service-description">
                    High-quality printing solutions for all your personal and
                    business needs
                  </p>
                </div>
                <div className="service-item">
                  <MoreHorizontal className="service-icon" size={40} />
                  <h3 className="service-title">And More</h3>
                  <p className="service-description">
                    Custom projects and specialized services tailored to your
                    unique requirements
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Work Gallery Section */}
          <div
            className="about-section gallery-section fade-in-section"
            data-section="gallery"
          >
            <div className="section-content">
              <p
                className="gallery-caption"
                style={{
                  fontStyle: "italic",
                  textAlign: "center",
                  margin: "1.5rem 0",
                  color: "var(--color-primary)",
                  fontSize: "1.1rem",
                }}
              >
                "We don't just make products; we create experiences and memories
                that last a lifetime."
              </p>

              <div className="gallery-grid">
                {/* Gallery Item 1 - Featured */}
                <div className="gallery-item featured">
                  <img
                    src={galleryImg1}
                    alt="Elegant wedding invitation design"
                  />
                  <div className="gallery-overlay">
                    <h4 className="gallery-title">Photo Strips</h4>
                    <p className="gallery-description">
                      Photo strips for your family and friends to cherish
                    </p>
                  </div>
                </div>

                {/* Gallery Item 2 */}
                <div className="gallery-item">
                  <img src={galleryImg2} alt="Handcrafted souvenir" />
                  <div className="gallery-overlay">
                    <h4 className="gallery-title">Printing service</h4>
                    <p className="gallery-description">
                      Bring your ideas to life with our printing services
                    </p>
                  </div>
                </div>

                {/* Gallery Item 3 */}
                <div className="gallery-item">
                  <img src={galleryImg3} alt="Digital layout design" />
                  <div className="gallery-overlay">
                    <h4 className="gallery-title">Digital Layouts</h4>
                    <p className="gallery-description">
                      Modern design solutions for events
                    </p>
                  </div>
                </div>

                {/* Gallery Item 4 */}
                <div className="gallery-item">
                  <img src={galleryImg4} alt="Event decoration" />
                  <div className="gallery-overlay">
                    <h4 className="gallery-title">Souvenirs</h4>
                    <p className="gallery-description">
                      capture the essence of your event
                    </p>
                  </div>
                </div>

                {/* Gallery Item 5 */}
                <div className="gallery-item">
                  <img src={galleryImg5} alt="Custom card design" />
                  <div className="gallery-overlay">
                    <h4 className="gallery-title">Custom Cards</h4>
                    <p className="gallery-description">
                      Personalized greeting cards and invitations
                    </p>
                  </div>
                </div>

                {/* Gallery Item 6 */}
                <div className="gallery-item">
                  <img src={galleryImg6} alt="Premium print materials" />
                  <div className="gallery-overlay">
                    <h4 className="gallery-title">Invitations</h4>
                    <p className="gallery-description">
                      High-quality and customized invitation designs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div
            className="about-section history-section fade-in-section"
            data-section="story"
          >
            <h2 className="section-title">
              <Heart className="section-icon" size={32} />
              Our Story
            </h2>
            <div className="history-content">
              <p className="history-text">
                Here's a quick story about how Little Crafts by WRT started.{" "}
                <span className="history-highlight">
                  Three years ago, I left my corporate job
                </span>{" "}
                to focus on my ukay clothing business. Sales were great for the
                first two years, but by the third year, I faced many challenges
                and started doubting my decision. It took a toll on me, and I
                felt lost. After four years, I decided to walk away from the
                business.
              </p>
              <p className="history-text">
                <span className="history-highlight">
                  That same year, my husband and I got married
                </span>
                , and I was struggling financially since ukay had been my main
                income for years. My husband covered most things, while I helped
                by DIYing parts of our wedding, especially the invitations. I
                shared these on social media, never thinking it would lead to
                the start of Little Crafts.
              </p>
              <p className="history-text">
                <span className="history-highlight">
                  It felt like God had a purpose in guiding me here.
                </span>{" "}
                Putting love in everything I crafted.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section fade-in-section">
          <h2 className="cta-title">Ready to Create Memories?</h2>
          <p className="cta-description">
            Experience our interactive photobooth and capture moments that will
            bring smiles for years to come. Perfect for creating lasting memories.
          </p>
          <Link to="/" className="cta-button">
            Start Photobooth <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Footer Section */}
      <div className="fade-in-section footer-wrapper" data-section="footer">
        <Footer />
      </div>
    </div>
  );
}
