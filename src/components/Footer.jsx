import { Facebook, Instagram, Mail, Phone } from "lucide-react";
import logoImage from "../assets/images/little-craft-logo-trans.png";
import "../assets/css/footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo">
        <img src={logoImage} alt="Little Crafts Logo" />
      </div>
      <div className="footer-contact">
        <div className="contact-item">
          <Phone size={18} />
          <span>+63 917 772 1157</span>
        </div>
        <div className="contact-item">
          <Mail size={18} />
          <span>contact@littlecrafts.com</span>
        </div>
      </div>
      <div className="footer-social">
        <a
          href="https://facebook.com/littlecrafts"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          <Facebook size={24} />
        </a>
        <a
          href="https://instagram.com/littlecrafts"
          target="_blank"
          rel="noopener noreferrer"
          className="social-link"
        >
          <Instagram size={24} />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
