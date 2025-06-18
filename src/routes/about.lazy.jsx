import { createLazyFileRoute, Link } from "@tanstack/react-router";
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
  Camera,
} from "lucide-react";
import "../assets/css/about.css";
import "../assets/css/gallery.css";

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
  return (
    <div className="page-container">
      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <h1 className="about-title">Little Crafts by WRT</h1>
          <p className="about-subtitle">
            Where creativity meets craftsmanship - bringing your ideas to life
            with passion and precision
          </p>
        </div>

        {/* Main Content */}
        <div className="about-content">
          {/* About Us Section */}
          <div className="about-section">
            <h2 className="section-title">
              <Building2 className="section-icon" size={32} />
              About Us
            </h2>
            <div className="section-content">
              <p>
                At <strong>Little Crafts by WRT</strong>,{" "}
                <em>creativity meets craftsmanship</em>. We are a dedicated arts
                and crafts studio offering a{" "}
                <strong>diverse range of services</strong> designed to bring
                your ideas to life.
              </p>
              <p>
                We specialize in{" "}
                <strong>
                  printing, digital layouts, custom invitations, souvenirs, and
                  many more
                </strong>
                . We focus on <em>quality and customer satisfaction</em>, making
                sure each product reflects our clients' needs and ideas.
              </p>
              <p>
                Whether you're planning a <strong>special event</strong>,
                launching a <strong>business</strong>, or simply looking to
                create something <em>meaningful</em>,{" "}
                <strong>Little Crafts by WRT</strong> is here to help bring your
                vision to life.
              </p>
            </div>
          </div>

          {/* Services Offered Section */}
          <div className="about-section">
            <h2 className="section-title">
              <Palette className="section-icon" size={32} />
              Services Offered
            </h2>
            <div className="section-content">
              <p>
                We offer a comprehensive range of creative services to meet all
                your design and printing needs:
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
          <div className="about-section gallery-section">
            <h2 className="section-title">
              <Camera className="section-icon" size={32} />
              Our Portfolio
            </h2>
            <div className="section-content">
              <p>
                Browse through our collection of creative works, showcasing our
                attention to detail and artistic vision. Each piece tells a
                unique story and represents our dedication to quality
                craftsmanship.
              </p>
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
          <div className="about-section history-section">
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
        <div className="cta-section">
          <h2 className="cta-title">Ready to Create Memories?</h2>
          <p className="cta-description">
            Experience our interactive photobooth and capture moments that will
            bring smiles for years to come. Perfect for events, celebrations,
            and creating lasting memories.
          </p>
          <Link to="/" className="cta-button">
            Start Photobooth <ArrowRight size={20} />
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
