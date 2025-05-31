import { createLazyFileRoute } from "@tanstack/react-router";
import Footer from "../components/Footer";
import { ShieldCheck } from "lucide-react";
import "../assets/css/privacy-policy.css";

export const Route = createLazyFileRoute("/privacy-policy")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="page-container">
      <div className="privacy-content">
        <ShieldCheck size={60} className="privacy-icon" />
        <h2 className="privacy-title">We Value Your Privacy</h2>

        <div className="privacy-section">
          <p className="privacy-description">
            All photos and data captured using this photobooth are not stored on
            any external database or server. Everything is processed locally on
            your device and remains there. This ensures that your personal data
            stays private and secure.
          </p>
          <span className="privacy-highlight">
            So do not worry, your secrets are safe—even from nosy cats!
          </span>
        </div>
      </div>
      <Footer />
    </div>
  );
}
