import { createContext, useRef, useState, useCallback, useContext } from "react";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

// Create the context
const BeautyFilterContext = createContext(null);

// Face mesh landmark indices for skin regions (cheeks, forehead, chin)
const SKIN_LANDMARK_INDICES = {
  leftCheek: [50, 101, 118, 117, 116, 123, 147, 187, 207, 206, 205],
  rightCheek: [280, 330, 347, 346, 345, 352, 376, 411, 427, 426, 425],
  forehead: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288],
  chin: [152, 148, 176, 149, 150, 136, 172, 138, 213, 192, 214],
  nose: [168, 6, 197, 195, 5],
};

/**
 * BeautyFilterProvider - Provides beauty filter functionality via context
 * The FaceLandmarker instance persists across route navigations
 */
export function BeautyFilterProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const faceLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastProcessedTimeRef = useRef(0);

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
  const detectFace = useCallback((video, timestamp) => {
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
  }, []);

  /**
   * Create a mask for skin regions based on landmarks
   */
  const createSkinMask = useCallback((ctx, width, height, landmarks) => {
    if (!landmarks) return null;

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext("2d");

    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, width, height);
    maskCtx.fillStyle = "white";

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

    maskCtx.filter = "blur(15px)";
    maskCtx.drawImage(maskCanvas, 0, 0);
    maskCtx.filter = "none";

    return maskCanvas;
  }, []);

  /**
   * Apply bilateral-like smoothing effect to canvas
   */
  const applySmoothingEffect = useCallback((sourceCanvas, intensity = 0.5) => {
    const width = sourceCanvas.width;
    const height = sourceCanvas.height;

    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = width;
    blurCanvas.height = height;
    const blurCtx = blurCanvas.getContext("2d");

    const blurAmount = 0.5 + intensity * 3.5;
    blurCtx.filter = `blur(${blurAmount}px)`;
    blurCtx.drawImage(sourceCanvas, 0, 0);
    blurCtx.filter = "none";

    return blurCanvas;
  }, []);

  /**
   * Apply beauty filter to a video element and render to canvas
   */
  const applyBeautyFilter = useCallback(
    (video, outputCanvas, { intensity = 0.5, enabled = true } = {}) => {
      if (!video || !outputCanvas) return;

      const ctx = outputCanvas.getContext("2d");
      const width = outputCanvas.width;
      const height = outputCanvas.height;

      ctx.drawImage(video, 0, 0, width, height);

      if (!enabled || !isInitialized || !faceLandmarkerRef.current) {
        return;
      }

      const now = performance.now();
      if (now - lastProcessedTimeRef.current < 50) {
        return;
      }
      lastProcessedTimeRef.current = now;

      const landmarks = detectFace(video, now);
      if (!landmarks) return;

      const skinMask = createSkinMask(ctx, width, height, landmarks);
      if (!skinMask) return;

      const smoothedCanvas = applySmoothingEffect(outputCanvas, intensity);

      ctx.save();
      ctx.globalCompositeOperation = "source-over";

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");

      tempCtx.drawImage(smoothedCanvas, 0, 0);
      tempCtx.globalCompositeOperation = "destination-in";
      tempCtx.drawImage(skinMask, 0, 0);

      ctx.globalAlpha = intensity;
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.globalAlpha = 1.0;

      ctx.restore();
    },
    [isInitialized, detectFace, createSkinMask, applySmoothingEffect]
  );

  /**
   * Apply beauty filter to a static image
   */
  const applyBeautyFilterToImage = useCallback(
    async (imageSrc, { intensity = 0.5 } = {}) => {
      return new Promise((resolve) => {
        if (!isInitialized) {
          resolve(imageSrc);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          ctx.drawImage(img, 0, 0);

          let result = imageSrc;

          try {
            faceLandmarkerRef.current.setOptions({ runningMode: "IMAGE" });

            const results = faceLandmarkerRef.current.detect(img);
            const landmarks = results.faceLandmarks?.[0];

            if (landmarks) {
              const skinMask = createSkinMask(
                ctx,
                canvas.width,
                canvas.height,
                landmarks
              );

              if (skinMask) {
                const smoothedCanvas = applySmoothingEffect(canvas, intensity);

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

            result = canvas.toDataURL("image/jpeg", 1.0);
          } catch (err) {
            console.error("Error applying beauty filter to image:", err);
          } finally {
            try {
              faceLandmarkerRef.current.setOptions({ runningMode: "VIDEO" });
            } catch (e) {
              console.warn("Failed to restore beauty filter to VIDEO mode:", e);
            }
            resolve(result);
          }
        };

        img.onerror = () => {
          resolve(imageSrc);
        };

        img.src = imageSrc;
      });
    },
    [isInitialized, createSkinMask, applySmoothingEffect]
  );

  /**
   * Apply beauty filter directly to a canvas using landmarks detected from video
   */
  const applyBeautyFilterToCanvas = useCallback(
    async (targetCanvas, videoElement, cropInfo, { intensity = 0.5 } = {}) => {
      if (
        !isInitialized ||
        !faceLandmarkerRef.current ||
        !videoElement ||
        !targetCanvas
      ) {
        return;
      }

      const now = performance.now();
      const results = faceLandmarkerRef.current.detectForVideo(
        videoElement,
        now
      );
      const landmarks = results.faceLandmarks?.[0];

      if (!landmarks) {
        return;
      }

      const mappedLandmarks = landmarks.map((point) => {
        const videoPixelX = point.x * videoElement.videoWidth;
        const videoPixelY = point.y * videoElement.videoHeight;

        const cropPixelX = videoPixelX - cropInfo.sourceX;
        const cropPixelY = videoPixelY - cropInfo.sourceY;

        return {
          x: cropPixelX / cropInfo.sourceWidth,
          y: cropPixelY / cropInfo.sourceHeight,
          z: point.z,
        };
      });

      const ctx = targetCanvas.getContext("2d");
      const skinMask = createSkinMask(
        ctx,
        targetCanvas.width,
        targetCanvas.height,
        mappedLandmarks
      );

      if (skinMask) {
        const smoothedCanvas = applySmoothingEffect(targetCanvas, intensity);

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = targetCanvas.width;
        tempCanvas.height = targetCanvas.height;
        const tempCtx = tempCanvas.getContext("2d");

        tempCtx.drawImage(smoothedCanvas, 0, 0);
        tempCtx.globalCompositeOperation = "destination-in";
        tempCtx.drawImage(skinMask, 0, 0);

        ctx.save();
        ctx.globalAlpha = intensity;
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }
    },
    [isInitialized, createSkinMask, applySmoothingEffect]
  );

  /**
   * Warm up the model with a single inference
   */
  const warmUp = useCallback(
    (videoElement) => {
      if (!isInitialized || !faceLandmarkerRef.current || !videoElement) return;

      try {
        const now = performance.now();
        faceLandmarkerRef.current.detectForVideo(videoElement, now);
        console.log("Beauty filter warm-up successful");
      } catch (err) {
        console.warn("Beauty filter warm-up skipped:", err);
      }
    },
    [isInitialized]
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

  const value = {
    isInitialized,
    isLoading,
    error,
    initialize,
    applyBeautyFilter,
    applyBeautyFilterToImage,
    applyBeautyFilterToCanvas,
    startRealTimeFilter,
    stopRealTimeFilter,
    warmUp,
  };

  return (
    <BeautyFilterContext.Provider value={value}>
      {children}
    </BeautyFilterContext.Provider>
  );
}

/**
 * Custom hook to use the beauty filter context
 */
export function useBeautyFilter() {
  const context = useContext(BeautyFilterContext);
  if (!context) {
    throw new Error("useBeautyFilter must be used within a BeautyFilterProvider");
  }
  return context;
}

export default BeautyFilterContext;
