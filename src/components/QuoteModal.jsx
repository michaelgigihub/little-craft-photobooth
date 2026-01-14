import { useEffect } from "react";
import "../assets/css/promo-modal.css";

const QuoteModal = ({
  isOpen,
  onClose,
  onDownload,
  hasDownloaded = false,
  pendingDownloadType = "jpeg",
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

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleContactUs = () => {
    // Open Facebook page in new tab
    window.open("https://www.facebook.com/WearItTw.Bales", "_blank");
    onClose();
  };

  return (
    <div
      className="promo-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
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
            id="quote-modal-title"
            className="promo-modal-title"
            data-count={hasDownloaded ? "downloaded" : "quote"}
          >
            {hasDownloaded ? "Perfect!" : "Almost There!"}
          </h2>
          <p className="promo-modal-subtitle">
            {hasDownloaded
              ? "Your photo is downloaded"
              : "Download your photo first to get a printing quote"}
          </p>
        </div>

        <div className="promo-modal-body">
          {!hasDownloaded ? (
            <>
            </>
          ) : (
            <>
              <p>
                Now let's get you connected with{" "}
                <span className="promo-highlight">Little Crafts</span> for
                printing services.
              </p>
              <p>Click the button below to message us on Facebook</p>
            </>
          )}
        </div>

        <div className="promo-modal-actions">
          {!hasDownloaded ? (
            <button
              className="promo-btn promo-btn-primary"
              onClick={onDownload}
            >
              Download {pendingDownloadType.toUpperCase()} Now
            </button>
          ) : (
            <button
              className="promo-btn promo-btn-primary"
              onClick={handleContactUs}
            >
              Contact Us on Facebook!
            </button>
          )}

          <button className="promo-btn promo-btn-secondary" onClick={onClose}>
            {hasDownloaded ? "Maybe Later" : "Cancel"}
          </button>

          {!hasDownloaded && (
            <p className="promo-small-text">
              You can download your photo and contact us for printing quotes
              anytime.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteModal;
