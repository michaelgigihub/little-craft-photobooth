import { createLazyFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";
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

gsap.registerPlugin(useGSAP, ScrollTrigger, TextPlugin);

export const Route = createLazyFileRoute("/about")({
  component: About,
});

function About() {
  const container = useRef(null);
  const [activeSection, setActiveSection] = useState("about");

  // Navigation items configuration
  const navigationItems = [
    { id: "about", label: "About Us" },
    { id: "services", label: "Services Offered" },
    { id: "gallery", label: "Our Crafts" },
    { id: "story", label: "Our Story" },
    { id: "footer", label: "Contact" },
  ];

  useGSAP(() => {
    // 1. Navigation Active State & Section Fade-ins
    const sections = gsap.utils.toArray(".gsap-fade-in");
    
    sections.forEach((section) => {
      const sectionId = section.getAttribute("data-section");
      
      // Separate ScrollTrigger exclusively for robust scroll-spy navigation
      if (sectionId) {
        ScrollTrigger.create({
          trigger: section,
          start: sectionId === "footer" ? "top 95%" : "top 75%",
          end: sectionId === "footer" ? "bottom 0%" : "bottom 75%",
          onToggle: (self) => {
            if (self.isActive) setActiveSection(sectionId);
          }
        });
      }

      // Setup timeline for each section animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: sectionId === "footer" ? "top 95%" : "top 80%", // trigger when top of section hits 80% down the viewport (95% for footer)
        }
      });

      // Different animation for CTA section
      if (section.classList.contains('cta-section')) {
        tl.from(section, {
          y: 30,
          scale: 0.98,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out"
        });
      } else {
        // Regular section fade-in
        tl.from(section, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: "power2.out"
        });
        
        // Stagger title and content
        const title = section.querySelector('.section-title');
        const content = section.querySelector('.section-content, .history-content');
        
        if (title && content) {
          tl.from([title, content], {
            y: 15,
            opacity: 0,
            duration: 0.6,
            stagger: 0.2,
            ease: "power2.out"
          }, "-=0.4");
        }
      }
    });

    // 2. Mobile Gallery Hover effect
    const galleryItems = gsap.utils.toArray(".gallery-item");
    galleryItems.forEach((item) => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 60%",
        end: "bottom 40%",
        toggleClass: "mobile-centered"
      });
    });

    // 3. Typewriter text
    gsap.to(".typewriter-text", {
      text: "Little Crafts by WRT",
      duration: 1.5,
      ease: "none",
      delay: 0.2,
      onComplete: () => {
        const cursor = gsap.utils.toArray(".cursor")[0];
        if (cursor) cursor.classList.add("finished");
      }
    });

    // 4. Cursor blink
    gsap.to(".cursor", {
      opacity: 0,
      ease: "power2.inOut",
      repeat: -1,
      yoyo: true,
      duration: 0.4
    });

  }, { scope: container });

  // Function to scroll to a specific section
  const scrollToSection = (sectionId) => {
    // Immediately update the active section for instant feedback
    setActiveSection(sectionId);

    if (sectionId === "about") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });
    }
  };

  return (
    <div className="page-container" ref={container}>
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
          <h1 className="about-title">
            <span className="typewriter-text"></span><span className="cursor"></span>
          </h1>
          <p className="about-subtitle">"Made by hand, lend by grace."</p>
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* About Us Section */}
          <div className="about-section gsap-fade-in" data-section="about">
            <h2 className="section-title">
              <Building2 className="section-icon" size={32} />
              About Us
            </h2>
            <div className="section-content">
              <p>At Little Crafts by WRT, creativity meets craftsmanship.</p>
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
            className="about-section gsap-fade-in"
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
            className="about-section gallery-section gsap-fade-in"
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
            className="about-section history-section gsap-fade-in"
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
        <div className="cta-section gsap-fade-in">
          <h2 className="cta-title">Ready to Create Memories?</h2>
          <p className="cta-description">
            Experience our interactive photobooth and capture moments that will
            bring smiles for years to come. Perfect for creating lasting
            memories.
          </p>
          <Link to="/" className="cta-button">
            Start Photobooth <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Footer Section */}
      <div className="gsap-fade-in footer-wrapper" data-section="footer">
        <Footer />
      </div>
    </div>
  );
}

export default About;
