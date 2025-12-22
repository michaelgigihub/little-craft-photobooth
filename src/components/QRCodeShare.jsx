import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  uploadPhotosToSupabase,
  generateShareableUrl,
  isSupabaseConfigured,
} from "../assets/javascript/photoSharingService";
import "../assets/css/qrcode-share.css";

/**
 * QR Code Share Component
 * Allows users to generate a QR code to share their photo strip
 */
export default function QRCodeShare({ photos, layout }) {
  const [isUploading, setIsUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [error, setError] = useState(null);

  // Don't render if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return null;
  }

  const handleGenerateQR = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadPhotosToSupabase(photos, layout);

      if (result.success) {
        const url = generateShareableUrl(result.sessionId);
        setShareUrl(url);
      } else {
        setError(result.error || "Failed to generate QR code");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setShareUrl(null);
    setError(null);
  };

  return (
    <div className="qr-share-container">
      <p>Share Your Photo Strip</p>

      {!shareUrl ? (
        <button
          onClick={handleGenerateQR}
          disabled={isUploading}
          className="action-btn qr-generate-btn"
        >
          {isUploading ? "Generating..." : "📱 Generate QR Code"}
        </button>
      ) : (
        <div className="qr-result">
          <div className="qr-code-wrapper">
            <QRCodeSVG
              value={shareUrl}
              size={200}
              level="M"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="qr-instruction">
            Scan with your phone to open on another device
          </p>
          <button onClick={handleReset} className="action-btn secondary">
            Generate New QR
          </button>
        </div>
      )}

      {error && <p className="qr-error">Error: {error}</p>}
    </div>
  );
}
