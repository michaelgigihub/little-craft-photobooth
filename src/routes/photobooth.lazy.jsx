import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { SwitchCamera } from "lucide-react";
import { usePhotoContext } from "../context/PhotoContext";
import "../assets/css/photobooth.lazy.css";

export const Route = createLazyFileRoute("/photobooth")({
  component: PhotoboothComponent,
});

function PhotoboothComponent() {
  const navigate = useNavigate();
  const { photoSession, addPhoto, clearPhotos, hasActiveSession } =
    usePhotoContext();
  const { layout, photoCount } = photoSession;

  // Redirect to home if no session is active
  useEffect(() => {
    if (!hasActiveSession()) {
      navigate({ to: "/" });
    }
  }, [hasActiveSession, navigate]);

  // Early return if no valid session to prevent errors during redirect
  if (!hasActiveSession()) {
    return (
      <div className="photobooth-container">
        <h2>Redirecting...</h2>
        <p>Setting up Photobooth session...</p>
      </div>
    );
  }
  const [capturing, setCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [countdownTime, setCountdownTime] = useState(3);
  const [webcamError, setWebcamError] = useState(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // "user" for front, "environment" for rear
  const [hasRearCamera, setHasRearCamera] = useState(false);
  const [mode, setMode] = useState("camera"); // "camera" or "upload"
  const [showCropPreview, setShowCropPreview] = useState(false);
  const [tempUploadedFile, setTempUploadedFile] = useState(null);
  const [cropFrameStyle, setCropFrameStyle] = useState({});
  const [isFlashing, setIsFlashing] = useState(false);
  const webcamRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const previewImageRef = useRef(null);

  // Debug log
  console.log("Current state:", {
    layout,
    photoCount,
    capturedPhotos: photoSession.photos.length,
    capturing,
  }); // Detect if we're on a mobile device
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  // Set up webcam constraints for maximum quality
  // Request highest resolution possible, cropping will be done at capture time
  const getVideoConstraints = () => {
    if (isMobile) {
      return {
        width: { ideal: 1920, min: 640 },
        height: { ideal: 1080, min: 480 },
        facingMode: facingMode,
        frameRate: { ideal: 30, min: 15 },
        // Request maximum resolution without aspect ratio constraint
        advanced: [
          { width: { min: 640, ideal: 1920, max: 3840 } },
          { height: { min: 480, ideal: 1080, max: 2160 } },
          { frameRate: { ideal: 30 } },
        ],
      };
    } else {
      return {
        width: { ideal: 1920, min: 1280 },
        height: { ideal: 1080, min: 720 },
        facingMode: facingMode,
        frameRate: { ideal: 30, min: 15 },
        // Request maximum resolution without aspect ratio constraint
        advanced: [
          { width: { min: 1280, ideal: 1920, max: 3840 } },
          { height: { min: 720, ideal: 1080, max: 2160 } },
          { frameRate: { ideal: 30 } },
        ],
      };
    }
  };

  // Determine if we should flip the video horizontally
  // Front camera (user) should be mirrored for natural selfie experience
  // Rear camera (environment) should NOT be mirrored, especially on mobile
  const shouldFlipVideo = () => {
    if (isMobile && facingMode === "environment") {
      return false; // Don't flip rear camera on mobile
    }
    return true; // Flip front camera and all cameras on desktop
  };

  const videoConstraints = getVideoConstraints();
  // Handle webcam errors
  const handleWebcamError = useCallback((error) => {
    console.error("Webcam error:", error);
    const errorMessage =
      "Unable to access camera. Please check your camera permissions and try again.";
    setWebcamError(errorMessage);
    alert(errorMessage);
  }, []); // Handle webcam ready (called when user media is accessed successfully)
  const handleWebcamReady = useCallback(async () => {
    console.log("Webcam is ready");
    setWebcamReady(true);
    setWebcamError(null);

    // Check cameras after permission is granted
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      ); // Check if we have rear cameras
      const hasRear = videoInputs.some(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("rear") ||
          device.label.toLowerCase().includes("environment")
      );

      // If we can't determine from labels, assume rear camera exists if there are multiple cameras
      const hasMultipleCameras = videoInputs.length > 1;
      setHasRearCamera(hasRear || hasMultipleCameras);

      console.log("Available cameras after permission granted:", {
        total: videoInputs.length,
        hasRear: hasRear || hasMultipleCameras,
        devices: videoInputs.map((d) => ({
          label: d.label,
          deviceId: d.deviceId,
        })),
      });
    } catch (error) {
      console.error("Error checking cameras after permission:", error);
      setHasRearCamera(false);
    }
  }, []);

  // Check for available cameras on component mount
  useEffect(() => {
    const checkCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );

        // Only do a basic check initially - detailed check happens after permission
        const hasMultipleCameras = videoInputs.length > 1;

        // If we have labels (permission already granted), do full check
        const hasLabels = videoInputs.some(
          (device) => device.label && device.label.trim() !== ""
        );
        if (hasLabels) {
          const hasRear = videoInputs.some(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("rear") ||
              device.label.toLowerCase().includes("environment")
          );
          setHasRearCamera(hasRear || hasMultipleCameras);
        } else {
          // Without permission, we can only guess based on device count
          // Set to false initially, will be updated when webcam is ready
          setHasRearCamera(false);
        }

        console.log("Initial camera check:", {
          total: videoInputs.length,
          hasLabels,
          hasMultipleCameras,
          devices: videoInputs.map((d) => ({
            label: d.label || "No label (permission needed)",
            deviceId: d.deviceId,
          })),
        });
      } catch (error) {
        console.error("Error checking cameras:", error);
        setHasRearCamera(false);
      }
    };

    checkCameras();
  }, []);
  // Function to switch camera
  const switchCamera = useCallback(() => {
    if (!hasRearCamera || countdown === 0 || capturing) return;

    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
    console.log(
      "Switching camera to:",
      facingMode === "user" ? "environment" : "user"
    );
  }, [hasRearCamera, countdown, facingMode, capturing]); // Function to capture a photo with maximum quality and proper aspect ratio cropping
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      // Trigger flash effect
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 500); // Flash duration

      // Get the webcam video element to check its actual dimensions
      const video = webcamRef.current.video;
      if (!video) return;

      console.log("Video dimensions:", {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      });

      // Create a canvas to properly crop the image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Set high-resolution output dimensions based on layout
      // Using 4x scale for print-quality output
      let targetWidth, targetHeight, targetAspect;

      if (layout === "c") {
        // Layout C uses 540:713 aspect ratio
        // Output at 4x scale: 2160×2852 for high-quality prints
        targetWidth = 2160;
        targetHeight = 2852;
        targetAspect = 540 / 713;
      } else {
        // Other layouts use 4:3 aspect ratio
        // Output at higher resolution: 2880×2160 for high-quality prints
        targetWidth = 2880;
        targetHeight = 2160;
        targetAspect = 4 / 3;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate the crop area to maintain target aspect ratio from the video
      const videoAspect = video.videoWidth / video.videoHeight;

      let sourceX = 0,
        sourceY = 0,
        sourceWidth = video.videoWidth,
        sourceHeight = video.videoHeight;

      if (videoAspect > targetAspect) {
        // Video is wider than target, crop the sides
        sourceWidth = video.videoHeight * targetAspect;
        sourceX = (video.videoWidth - sourceWidth) / 2;
      } else {
        // Video is taller than target, crop top and bottom
        sourceHeight = video.videoWidth / targetAspect;
        sourceY = (video.videoHeight - sourceHeight) / 2;
      }
      console.log("Crop area:", {
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        cropAspect: sourceWidth / sourceHeight,
        layout,
        targetAspect,
      });

      // Draw the cropped video frame to match what's shown in the preview
      // Determine flip logic at capture time based on current camera state
      const shouldFlip =
        isMobile && facingMode === "environment" ? false : true;

      console.log("Capture flip logic:", {
        isMobile,
        facingMode,
        shouldFlip,
      });

      if (shouldFlip) {
        ctx.scale(-1, 1);
        ctx.drawImage(
          video,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          -targetWidth,
          0,
          targetWidth,
          targetHeight
        );
      } else {
        // Don't flip for rear camera on mobile
        ctx.drawImage(
          video,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );
      }

      // Convert to high-quality JPEG
      const imageSrc = canvas.toDataURL("image/jpeg", 1.0);
      addPhoto(imageSrc);
      console.log(
        `Captured photo ${photoSession.photos.length + 1} of ${photoCount} - Size: ${targetWidth}x${targetHeight}`
      );
    }
  }, [
    webcamRef,
    addPhoto,
    photoSession.photos.length,
    photoCount,
    isMobile,
    facingMode,
    layout,
    setIsFlashing,
  ]);
  // Function to handle single countdown and photo capture
  const handleCountdown = useCallback(() => {
    return new Promise((resolve) => {
      setCountdown(countdownTime);

      let count = countdownTime;
      const timer = setInterval(() => {
        count -= 1;

        if (count <= 0) {
          // Don't show 0, capture immediately
          setCountdown(null);
          clearInterval(timer);
          capturePhoto();
          setTimeout(resolve, 600); // Short delay after capture
        } else {
          setCountdown(count);
        }
      }, 1000);
    });
  }, [capturePhoto, countdownTime]);

  // Start the capturing process
  const startCapturing = useCallback(async () => {
    if (photoSession.photos.length >= photoCount) {
      clearPhotos(); // Reset if we already have photos
    }

    setCapturing(true);

    try {
      // First photo
      await handleCountdown();

      // Wait between photos
      const totalPhotosNeeded = photoCount;
      let photosTaken = 1; // We just took one photo

      while (photosTaken < totalPhotosNeeded) {
        await new Promise((resolve) => setTimeout(resolve, 300)); // Pause between photos
        await handleCountdown();
        photosTaken++;
      }
    } finally {
      setCapturing(false);
      setCountdown(null);
    }
  }, [handleCountdown, photoCount, photoSession.photos.length, clearPhotos]);

  // Redirect to photo-strip-preview when all photos are captured
  useEffect(() => {
    if (
      photoSession.photos.length === photoCount &&
      photoSession.photos.length > 0
    ) {
      // Navigate to photo-strip-preview
      navigate({ to: "/photo-strip-preview" });
    }
  }, [photoSession.photos, photoCount, navigate]); // Reset the captures
  const resetCaptures = () => {
    clearPhotos();
    setCapturing(false);
    setCountdown(null);
    setShowCropPreview(false);
    setTempUploadedFile(null);
  };

  // Function to handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      // Reset the file input
      event.target.value = "";
      return;
    }

    // Check file size (optional: limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("Please select an image smaller than 10MB.");
      // Reset the file input
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setTempUploadedFile(e.target.result);
      setShowCropPreview(true);
    };
    reader.readAsDataURL(file);

    // Reset the file input so the same file can be selected again if needed
    event.target.value = "";
  };

  // Function to process and crop uploaded image
  const processUploadedImage = useCallback(() => {
    if (!tempUploadedFile || !cropCanvasRef.current) return;

    const canvas = cropCanvasRef.current;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = () => {
      // Set high-resolution output dimensions based on layout
      // Using 4x scale for print-quality output (same as camera capture)
      let targetWidth, targetHeight, targetAspect;

      if (layout === "c") {
        // Layout C uses 540:713 aspect ratio
        // Output at 4x scale: 2160×2852 for high-quality prints
        targetWidth = 2160;
        targetHeight = 2852;
        targetAspect = 540 / 713;
      } else {
        // Other layouts use 4:3 aspect ratio
        // Output at higher resolution: 2880×2160 for high-quality prints
        targetWidth = 2880;
        targetHeight = 2160;
        targetAspect = 4 / 3;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate crop area to maintain target aspect ratio
      const imgAspect = img.width / img.height;

      let sourceX = 0,
        sourceY = 0,
        sourceWidth = img.width,
        sourceHeight = img.height;

      if (imgAspect > targetAspect) {
        // Image is wider than target, crop the sides
        sourceWidth = img.height * targetAspect;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Image is taller than target, crop top and bottom
        sourceHeight = img.width / targetAspect;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        targetWidth,
        targetHeight
      ); // Convert to base64 and add to photos
      const croppedImageSrc = canvas.toDataURL("image/jpeg", 1.0);
      addPhoto(croppedImageSrc);

      // Reset upload state
      setShowCropPreview(false);
      setTempUploadedFile(null);
    };
    img.src = tempUploadedFile;
  }, [tempUploadedFile, layout, addPhoto]);

  // Function to cancel crop preview
  const cancelCropPreview = () => {
    setShowCropPreview(false);
    setTempUploadedFile(null);
    setCropFrameStyle({});
  }; // Function to calculate crop frame dimensions based on the actual image display
  const calculateCropFrame = useCallback(() => {
    if (!previewImageRef.current) return;

    const img = previewImageRef.current;
    const container = img.parentElement; // The crop-preview-image div

    // Get the target aspect ratio based on layout
    const targetAspect = layout === "c" ? 540 / 713 : 4 / 3;

    // Get container dimensions
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Calculate how the image is displayed with object-fit: contain
    const imgNaturalAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayedWidth, displayedHeight;
    let imageOffsetX = 0,
      imageOffsetY = 0;

    if (imgNaturalAspect > containerAspect) {
      // Image is constrained by container width
      displayedWidth = containerWidth;
      displayedHeight = containerWidth / imgNaturalAspect;
      imageOffsetX = 0;
      imageOffsetY = (containerHeight - displayedHeight) / 2;
    } else {
      // Image is constrained by container height
      displayedHeight = containerHeight;
      displayedWidth = containerHeight * imgNaturalAspect;
      imageOffsetX = (containerWidth - displayedWidth) / 2;
      imageOffsetY = 0;
    }

    // Calculate crop frame dimensions to match target aspect ratio
    let cropWidth, cropHeight;

    if (imgNaturalAspect > targetAspect) {
      // Image is wider than target ratio - crop from sides
      cropHeight = displayedHeight;
      cropWidth = cropHeight * targetAspect;
    } else {
      // Image is taller than target ratio - crop from top/bottom
      cropWidth = displayedWidth;
      cropHeight = cropWidth / targetAspect;
    } // Center the crop frame within the displayed image area
    const cropLeft = imageOffsetX + (displayedWidth - cropWidth) / 2;
    const cropTop = imageOffsetY + (displayedHeight - cropHeight) / 2;

    // Position relative to the container
    const frameStyle = {
      position: "absolute",
      left: `${cropLeft}px`,
      top: `${cropTop}px`,
      width: `${cropWidth}px`,
      height: `${cropHeight}px`,
      border: "2px solid #fff",
      boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
      pointerEvents: "none",
      transform: "none", // Override CSS transform
    };

    setCropFrameStyle(frameStyle);
  }, [layout]);

  // Handle image load to calculate crop frame
  const handleImageLoad = () => {
    // Small delay to ensure the image is properly rendered
    setTimeout(calculateCropFrame, 50);
  };

  // Recalculate crop frame on window resize
  useEffect(() => {
    if (showCropPreview) {
      const handleResize = () => {
        setTimeout(calculateCropFrame, 50);
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [showCropPreview, calculateCropFrame]);

  return (
    <div className="photobooth-container">
      <h2>Photobooth</h2>
      <div className="photo-count-info">
        Layout: {layout.toUpperCase()} - {photoCount} photos
      </div>

      {/* Mode Switcher */}
      {photoSession.photos.length < photoCount && (
        <div className="mode-switcher">
          <button
            className={`mode-btn ${mode === "camera" ? "active" : ""}`}
            onClick={() => setMode("camera")}
            disabled={capturing}
          >
            📷 Camera
          </button>
          <button
            className={`mode-btn ${mode === "upload" ? "active" : ""}`}
            onClick={() => setMode("upload")}
            disabled={capturing}
          >
            📁 Upload
          </button>
        </div>
      )}

      {photoSession.photos.length < photoCount && (
        <div className="webcam-preview-container">
          {/* Camera Mode */}
          {mode === "camera" && (
            <>
              {!webcamReady && !webcamError && (
                <div className="webcam-loading">
                  <p style={{ textAlign: "center", margin: "10px 0" }}>
                    Loading camera...
                  </p>
                </div>
              )}{" "}
              <div
                className={`webcam-container ${layout === "c" ? "layout-c" : ""} ${isFlashing ? "flash" : ""}`}
              >
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  key={facingMode}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={1.0}
                  videoConstraints={videoConstraints}
                  className="webcam-video"
                  style={{
                    transform: shouldFlipVideo() ? "scaleX(-1)" : "scaleX(1)",
                    opacity: webcamReady ? 1 : 0.5,
                  }}
                  onUserMedia={handleWebcamReady}
                  onUserMediaError={handleWebcamError}
                />

                {countdown !== null && countdown >= 0 && (
                  <div className="counter">{countdown}</div>
                )}

                {/* Camera switch button */}
                <button
                  className={`camera-switch-btn ${!hasRearCamera || countdown === 0 || capturing ? "disabled" : ""}`}
                  onClick={switchCamera}
                  disabled={!hasRearCamera || countdown === 0 || capturing}
                  title={
                    capturing
                      ? "Cannot switch camera during capture session"
                      : hasRearCamera
                        ? "Switch Camera"
                        : "No rear camera available"
                  }
                >
                  <SwitchCamera size={24} />
                </button>
              </div>
            </>
          )}

          {/* Upload Mode */}
          {mode === "upload" && (
            <div
              className={`upload-container ${layout === "c" ? "layout-c" : ""}`}
            >
              {!showCropPreview ? (
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="file-upload" className="upload-label">
                    <div className="upload-content">
                      <div className="upload-icon">📁</div>
                      <div className="upload-text">
                        <h3>Upload Photo {photoSession.photos.length + 1}</h3>
                        <p>Click to select an image</p>
                        <small>
                          {layout === "c"
                            ? "Image will be cropped to 540:713 ratio"
                            : "Image will be cropped to 4:3 ratio"}
                        </small>
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="crop-preview-container">
                  <div className="crop-preview-area">
                    <canvas ref={cropCanvasRef} style={{ display: "none" }} />
                    <div className="crop-preview-image">
                      <img
                        src={tempUploadedFile}
                        alt="Upload preview"
                        className="preview-img"
                        ref={previewImageRef}
                        onLoad={handleImageLoad}
                      />
                      <div className="crop-overlay">
                        <div
                          className="crop-frame"
                          style={cropFrameStyle}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="crop-controls">
                    <button
                      className="crop-btn cancel"
                      onClick={cancelCropPreview}
                    >
                      Cancel
                    </button>
                    <button
                      className="crop-btn confirm"
                      onClick={processUploadedImage}
                    >
                      Use This Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview of the latest captured photo */}
          {photoSession.photos.length > 0 && (
            <div className="preview-container">
              <img
                src={photoSession.photos[photoSession.photos.length - 1]}
                alt="Last captured photo"
                className="preview-image"
              />
              <div className="preview-label">
                Photo {photoSession.photos.length}/{photoCount}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Countdown Selector - Only show for camera mode */}
      {photoSession.photos.length < photoCount &&
        !capturing &&
        mode === "camera" && (
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
        {photoSession.photos.length < photoCount ? (
          <>
            {mode === "camera" && (
              <button
                className="capture-btn"
                onClick={startCapturing}
                disabled={capturing || !webcamReady || !!webcamError}
              >
                {photoSession.photos.length === 0
                  ? !webcamReady
                    ? "Preparing camera..."
                    : webcamError
                      ? "Camera unavailable"
                      : "Start Taking Photos"
                  : capturing
                    ? `Capturing in progress...`
                    : `Continue Photo Session (${photoSession.photos.length}/${photoCount} taken)`}
              </button>
            )}
            {mode === "upload" && !showCropPreview && (
              <div className="upload-instructions">
                <p>
                  Select {photoCount - photoSession.photos.length} more photo
                  {photoCount - photoSession.photos.length > 1 ? "s" : ""}
                </p>
                <p>
                  Progress: {photoSession.photos.length}/{photoCount} photos
                  selected
                </p>
              </div>
            )}
          </>
        ) : (
          <button className="finish-btn" onClick={resetCaptures}>
            Reset & Take New Photos
          </button>
        )}

        {capturing && (
          <p className="capturing-status">
            Taking photo {photoSession.photos.length + 1} of {photoCount}
            {countdown !== null && countdown > 0 && ` in ${countdown}...`}
          </p>
        )}
      </div>
    </div>
  );
}
