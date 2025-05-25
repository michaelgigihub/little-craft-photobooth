import { createLazyFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import "../assets/css/photobooth.lazy.css";

export const Route = createLazyFileRoute("/photobooth")({
  component: PhotoboothComponent,
});

function PhotoboothComponent() {
  const search = useSearch({ from: "/photobooth" });
  const { layout, photoCount } = search;
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [photosRemaining, setPhotosRemaining] = useState(
    parseInt(photoCount) || 4
  );
  const [countdownTime, setCountdownTime] = useState(3); // Default to 3 seconds
  const webcamRef = useRef(null);

  // Debug log
  console.log("Current state:", {
    layout,
    photoCount: parseInt(photoCount),
    capturedPhotos: capturedPhotos.length,
    photosRemaining,
    capturing,
  });

  // Set up webcam constraints for better quality with 4:3 aspect ratio
  const videoConstraints = {
    width: 1024,
    height: 768, // 4:3 aspect ratio
    facingMode: "user",
  };

  // Initialize photos remaining when component mounts or photoCount changes
  useEffect(() => {
    setPhotosRemaining(parseInt(photoCount) || 4);
  }, [photoCount]);

  // Function to capture a photo
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedPhotos((prev) => {
        const newPhotos = [...prev, imageSrc];
        console.log(`Captured photo ${newPhotos.length} of ${photoCount}`);

        // Update remaining photos
        setPhotosRemaining((prevRemaining) => Math.max(0, prevRemaining - 1));

        return newPhotos;
      });
    }
  }, [webcamRef, photoCount]);

  // Function to handle single countdown and photo capture
  const handleCountdown = useCallback(() => {
    return new Promise((resolve) => {
      setCountdown(countdownTime);

      let count = countdownTime;
      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);

        if (count <= 0) {
          clearInterval(timer);
          capturePhoto();
          setTimeout(resolve, 500); // Short delay after capture
        }
      }, 1000);
    });
  }, [capturePhoto, countdownTime]);

  // Start the capturing process
  const startCapturing = useCallback(async () => {
    if (capturedPhotos.length >= parseInt(photoCount)) {
      setCapturedPhotos([]); // Reset if we already have photos
      setPhotosRemaining(parseInt(photoCount));
    }

    setCapturing(true);

    try {
      // First photo
      await handleCountdown();

      // Wait between photos
      const totalPhotosNeeded = parseInt(photoCount);
      let photosTaken = 1; // We just took one photo

      while (photosTaken < totalPhotosNeeded) {
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Pause between photos
        await handleCountdown();
        photosTaken++;
      }
    } finally {
      setCapturing(false);
      setCountdown(null);
    }
  }, [handleCountdown, photoCount, capturedPhotos.length]);

  // Reset the captures
  const resetCaptures = () => {
    setCapturedPhotos([]);
    setCapturing(false);
    setCountdown(null);
    setPhotosRemaining(parseInt(photoCount) || 4);
  };

  // Determine layout class for the grid
  const getLayoutClass = () => {
    switch (layout) {
      case "a":
        return "layout-a";
      case "b":
        return "layout-b";
      case "c":
        return "layout-c";
      case "d":
        return "layout-d";
      default:
        return "layout-a";
    }
  };

  return (
    <div className="photobooth-container">
      <h2>Photo Booth</h2>
      <div className="photo-count-info">
        Layout: {layout.toUpperCase()} - {photoCount} photos
      </div>

      {capturedPhotos.length < photoCount && (
        <div className="webcam-container">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="webcam-video"
            style={{ transform: "scaleX(-1)" }}
          />
          {countdown !== null && countdown > 0 && (
            <div className="counter">{countdown}</div>
          )}
        </div>
      )}

      {capturedPhotos.length < photoCount && !capturing && (
        <div className="countdown-selector">
          <p>Select Countdown Time</p>
          <div className="countdown-options">
            <button
              className="countdown-option"
              onClick={() => setCountdownTime(3)}
              data-selected={countdownTime === 3}
            >
              3 sec
            </button>
            <button
              className="countdown-option"
              onClick={() => setCountdownTime(5)}
              data-selected={countdownTime === 5}
            >
              5 sec
            </button>
            <button
              className="countdown-option"
              onClick={() => setCountdownTime(10)}
              data-selected={countdownTime === 10}
            >
              10 sec
            </button>
          </div>
        </div>
      )}

      <div className="controls">
        {capturedPhotos.length < parseInt(photoCount) ? (
          <button
            className="capture-btn"
            onClick={startCapturing}
            disabled={capturing}
          >
            {capturedPhotos.length === 0
              ? "Start Taking Photos"
              : capturing
                ? `Capturing in progress...`
                : `Continue Photo Session (${capturedPhotos.length}/${photoCount} taken)`}
          </button>
        ) : (
          <button className="finish-btn" onClick={resetCaptures}>
            Reset & Take New Photos
          </button>
        )}

        {capturing && (
          <p className="capturing-status">
            Taking photo {capturedPhotos.length + 1} of {parseInt(photoCount)}
            {countdown !== null && countdown > 0 && ` in ${countdown}...`}
          </p>
        )}
      </div>

      {capturedPhotos.length > 0 && (
        <>
          <h3>
            Captured Photos ({capturedPhotos.length}/{photoCount})
          </h3>
          <div className={`photos-grid ${getLayoutClass()}`}>
            {capturedPhotos.map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Captured photo ${index + 1}`}
                className="photo-preview"
              />
            ))}
          </div>
        </>
      )}

      {capturedPhotos.length === photoCount && (
        <div className="strip-preview">
          <h3>Your Photo Strip is Ready!</h3>
          <p>You can download or share your photos from here.</p>
          {/* Additional functionality like download/share could be added here */}
        </div>
      )}
    </div>
  );
}
