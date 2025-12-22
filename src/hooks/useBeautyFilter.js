import { useRef, useState, useCallback, useEffect } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/**
 * Custom hook for applying beauty filter (face smoothing) using MediaPipe Face Landmarker
 *
 * @returns {Object} Hook state and methods
 */
export function useBeautyFilter() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastProcessedTimeRef = useRef(0);

  // Face mesh landmark indices for skin regions (cheeks, forehead, chin)
  // These define the areas where we'll apply smoothing
  const SKIN_LANDMARK_INDICES = {
    // Left cheek region
    leftCheek: [50, 101, 118, 117, 116, 123, 147, 187, 207, 206, 205],
    // Right cheek region
    rightCheek: [280, 330, 347, 346, 345, 352, 376, 411, 427, 426, 425],
    // Forehead region
    forehead: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288],
    // Chin region
    chin: [152, 148, 176, 149, 150, 136, 172, 138, 213, 192, 214],
    // Nose bridge (subtle smoothing)
    nose: [168, 6, 197, 195, 5],
  };

  /**
   * Initialize the MediaPipe Face Landmarker
   */
  const initialize = useCallback(async () => {
    if (isInitialized || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      faceLandmarkerRef.current = faceLandmarker;
      setIsInitialized(true);
      console.log("Beauty filter initialized successfully");
    } catch (err) {
      console.error("Failed to initialize beauty filter:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, isLoading]);

  /**
   * Get face landmarks from video frame
   */
  const detectFace = useCallback(
    (video, timestamp) => {
      if (!faceLandmarkerRef.current || !video) return null;

      try {
        const results = faceLandmarkerRef.current.detectForVideo(
          video,
          timestamp
        );
        return results.faceLandmarks?.[0] || null;
      } catch (err) {
        console.error("Face detection error:", err);
        return null;
      }
    },
    []
  );

  /**
   * Create a mask for skin regions based on landmarks
   */
  const createSkinMask = useCallback(
    (ctx, width, height, landmarks) => {
      if (!landmarks) return null;

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext("2d");

      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, width, height);
      maskCtx.fillStyle = "white";

      // Draw filled polygons for each skin region
      Object.values(SKIN_LANDMARK_INDICES).forEach((indices) => {
        maskCtx.beginPath();
        indices.forEach((idx, i) => {
          const point = landmarks[idx];
          if (point) {
            const x = point.x * width;
            const y = point.y * height;
            if (i === 0) {
              maskCtx.moveTo(x, y);
            } else {
              maskCtx.lineTo(x, y);
            }
          }
        });
        maskCtx.closePath();
        maskCtx.fill();
      });

      // Apply gaussian blur to the mask for smooth edges
      maskCtx.filter = "blur(15px)";
      maskCtx.drawImage(maskCanvas, 0, 0);
      maskCtx.filter = "none";

      return maskCanvas;
    },
    [SKIN_LANDMARK_INDICES]
  );

  /**
   * Apply bilateral-like smoothing effect to canvas
   * This creates a softer skin appearance while preserving edges
   */
  const applySmoothingEffect = useCallback(
    (sourceCanvas, intensity = 0.5) => {
      const width = sourceCanvas.width;
      const height = sourceCanvas.height;

      // Create working canvas for the blurred version
      const blurCanvas = document.createElement("canvas");
      blurCanvas.width = width;
      blurCanvas.height = height;
      const blurCtx = blurCanvas.getContext("2d");

      // Apply blur based on intensity (0.5 to 3px blur)
      const blurAmount = 0.5 + intensity * 3.5;
      blurCtx.filter = `blur(${blurAmount}px)`;
      blurCtx.drawImage(sourceCanvas, 0, 0);
      blurCtx.filter = "none";

      return blurCanvas;
    },
    []
  );

  /**
   * Apply beauty filter to a video element and render to canvas
   * This is the main function called for real-time preview
   */
  const applyBeautyFilter = useCallback(
    (
      video,
      outputCanvas,
      { intensity = 0.5, enabled = true } = {}
    ) => {
      if (!video || !outputCanvas) return;

      const ctx = outputCanvas.getContext("2d");
      const width = outputCanvas.width;
      const height = outputCanvas.height;

      // Draw original frame first
      ctx.drawImage(video, 0, 0, width, height);

      if (!enabled || !isInitialized || !faceLandmarkerRef.current) {
        return;
      }

      const now = performance.now();
      // Throttle face detection to ~20fps for performance
      if (now - lastProcessedTimeRef.current < 50) {
        return;
      }
      lastProcessedTimeRef.current = now;

      // Detect face landmarks
      const landmarks = detectFace(video, now);
      if (!landmarks) return;

      // Create skin mask
      const skinMask = createSkinMask(ctx, width, height, landmarks);
      if (!skinMask) return;

      // Create smoothed version of the frame
      const smoothedCanvas = applySmoothingEffect(outputCanvas, intensity);

      // Blend smoothed version only in skin areas using the mask
      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      // Use the mask to blend
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");

      // Draw smoothed image
      tempCtx.drawImage(smoothedCanvas, 0, 0);

      // Use mask as alpha channel
      tempCtx.globalCompositeOperation = "destination-in";
      tempCtx.drawImage(skinMask, 0, 0);

      // Blend onto original with intensity
      ctx.globalAlpha = intensity;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.globalAlpha = 1.0;

      ctx.restore();
    },
    [
      isInitialized,
      detectFace,
      createSkinMask,
      applySmoothingEffect,
    ]
  );

  /**
   * Apply beauty filter to a static image (for captured photos)
   * Returns a promise that resolves to the filtered image data URL
   */
  const applyBeautyFilterToImage = useCallback(
    async (imageSrc, { intensity = 0.5 } = {}) => {
      return new Promise((resolve, reject) => {
        if (!isInitialized) {
          // If not initialized, return original image
          resolve(imageSrc);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // For static images, we use IMAGE mode detection
          try {
            // Switch to IMAGE mode temporarily
            faceLandmarkerRef.current.setOptions({ runningMode: "IMAGE" });

            const results = faceLandmarkerRef.current.detect(img);
            const landmarks = results.faceLandmarks?.[0];

            if (landmarks) {
              // Create skin mask
              const skinMask = createSkinMask(
                ctx,
                canvas.width,
                canvas.height,
                landmarks
              );

              if (skinMask) {
                // Create smoothed version
                const smoothedCanvas = applySmoothingEffect(canvas, intensity);

                // Blend
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext("2d");

                tempCtx.drawImage(smoothedCanvas, 0, 0);
                tempCtx.globalCompositeOperation = "destination-in";
                tempCtx.drawImage(skinMask, 0, 0);

                ctx.globalAlpha = intensity;
                ctx.drawImage(tempCanvas, 0, 0);
                ctx.globalAlpha = 1.0;
              }
            }

            // Switch back to VIDEO mode
            faceLandmarkerRef.current.setOptions({ runningMode: "VIDEO" });

            resolve(canvas.toDataURL("image/jpeg", 1.0));
          } catch (err) {
            console.error("Error applying beauty filter to image:", err);
            // Switch back to VIDEO mode on error
            try {
              faceLandmarkerRef.current.setOptions({ runningMode: "VIDEO" });
            } catch (e) {
              // Ignore
            }
            resolve(imageSrc); // Return original on error
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = imageSrc;
      });
    },
    [isInitialized, createSkinMask, applySmoothingEffect]
  );

  /**
   * Start real-time beauty filter rendering loop
   */
  const startRealTimeFilter = useCallback(
    (video, outputCanvas, options = {}) => {
      const render = () => {
        applyBeautyFilter(video, outputCanvas, options);
        animationFrameRef.current = requestAnimationFrame(render);
      };
      render();
    },
    [applyBeautyFilter]
  );

  /**
   * Stop real-time rendering loop
   */
  const stopRealTimeFilter = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopRealTimeFilter();
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
        faceLandmarkerRef.current = null;
      }
    };
  }, [stopRealTimeFilter]);

  return {
    // State
    isInitialized,
    isLoading,
    error,

    // Methods
    initialize,
    applyBeautyFilter,
    applyBeautyFilterToImage,
    startRealTimeFilter,
    stopRealTimeFilter,
  };
}

export default useBeautyFilter;
