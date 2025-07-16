import { useEffect } from "react";
import "../assets/css/promo-modal.css";

const features = [
  "High-quality photo paper that lasts",
  "Vibrant colors that pop",
  "Perfect keepsake for events & memories",
  "Fast, affordable local printing",
]; 
const PromoModal = ({
  isOpen,
  onClose,
  onProceedAnyway,
  onGetQuote,
  downloadCount = 1,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      document.body.style.top = `-${scrollY}px`;
      document.body.classList.add("modal-open");

      return () => {
        // Restore scroll position when modal closes
        document.body.classList.remove("modal-open");
        document.body.style.top = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Personalized messages based on download count
  const getModalContent = () => {
    switch (downloadCount) {
      case 1:
        return {
          title: "Welcome!",
          subtitle: "Love your first photo strip?",
          message:
            "Your photo strip looks amazing! Why not bring it to life with a professional print from Little Craft?",
          features,
        };
      case 5:
        return {
          title: "You're back!",
          subtitle: "Loving the photo booth experience?",
          message:
            "We've noticed you're creating lots of memories! Consider getting your favorite photos professionally printed with Little Craft.",
          features,
        };
      case 15:
        return {
          title: "Photo Enthusiast!",
          subtitle: "You've created 15 amazing photo strips!",
          message:
            "You're clearly loving the photo booth! As a valued user, let us help you preserve these special moments with professional printing services.",
          features,
        };
      default:
        return {
          title: "Wait!",
          subtitle: "Want a physical copy of your memories?",
          message:
            "Your photo strip looks amazing! Why not bring it to life with a professional print from Little Craft?",
          features: [
            "High-quality photo paper that lasts",
            "Vibrant colors that pop",
            "Perfect keepsake for events & memories",
            "Fast, affordable local printing",
          ],
        };
    }
  };

  const content = getModalContent();
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };
  return (
    <div
      className="promo-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-modal-title"
    >
      <div className="promo-modal">
        <div className="promo-modal-header">
          <button
            className="promo-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>{" "}
          <h2
            id="promo-modal-title"
            className="promo-modal-title"
            data-count={downloadCount}
          >
            {content.title}
          </h2>
          <p className="promo-modal-subtitle">{content.subtitle}</p>
        </div>
        <div className="promo-modal-body">
          <p>
            {content.message.includes("Little Craft") ? (
              <>
                {content.message.split("Little Craft")[0]}
                <span className="promo-highlight">Little Craft</span>
                {content.message.split("Little Craft")[1]}
              </>
            ) : (
              content.message
            )}
          </p>

          <ul className="promo-features">
            {content.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>

          <p>
            Contact us for custom printing options, bulk orders, or special
            event packages!
          </p>
        </div>{" "}
        <div className="promo-modal-actions">
          <button className="promo-btn promo-btn-primary" onClick={onGetQuote}>
            Print with Little Craft
          </button>

          <button
            className="promo-btn promo-btn-secondary"
            onClick={onProceedAnyway}
          >
            Download Only
          </button>

          <p className="promo-small-text">
            You can always download your digital copy and contact us later for
            printing services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromoModal;
