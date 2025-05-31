import { createContext, useContext, useState, useEffect } from "react";

const PhotoContext = createContext();

const STORAGE_KEY = "little-craft-photobooth-session";

// Helper function to load session from localStorage
const loadSessionFromStorage = () => {
  try {
    const storedSession = localStorage.getItem(STORAGE_KEY);
    if (storedSession) {
      const parsedSession = JSON.parse(storedSession);
      // Only validate and restore layout and photoCount - no photos
      if (
        parsedSession &&
        typeof parsedSession.layout === "string" &&
        typeof parsedSession.photoCount === "number"
      ) {
        return {
          layout: parsedSession.layout,
          photoCount: parsedSession.photoCount,
          photos: [], // Always start fresh with photos
          isComplete: false,
        };
      }
    }
  } catch (error) {
    console.warn("Failed to load session from localStorage:", error);
  }
  return {
    layout: null,
    photoCount: 0,
    photos: [],
    isComplete: false,
  };
};

// Helper function to save only layout and photoCount to localStorage
const saveSessionToStorage = (session) => {
  try {
    // Only save layout and photoCount - never save photos
    if (session.layout && session.photoCount > 0) {
      const sessionMetadata = {
        layout: session.layout,
        photoCount: session.photoCount,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionMetadata));
    } else {
      // Clear storage if no active session
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Failed to save session to localStorage:", error);
  }
};

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error("usePhotoContext must be used within a PhotoProvider");
  }
  return context;
};

export const PhotoProvider = ({ children }) => {
  const [photoSession, setPhotoSession] = useState(loadSessionFromStorage);

  // Save to localStorage whenever photoSession changes
  useEffect(() => {
    saveSessionToStorage(photoSession);
  }, [photoSession]);
  const startNewSession = (layout, photoCount) => {
    setPhotoSession({
      layout,
      photoCount: parseInt(photoCount),
      photos: [],
      isComplete: false,
    });
  };
  const addPhoto = (photoData) => {
    setPhotoSession((prev) => {
      const newPhotos = [...prev.photos, photoData];
      const isComplete = newPhotos.length >= prev.photoCount;

      return {
        ...prev,
        photos: newPhotos,
        isComplete,
      };
    });
  };
  const resetSession = () => {
    const newSession = {
      layout: null,
      photoCount: 0,
      photos: [],
      isComplete: false,
    };
    setPhotoSession(newSession);
    // Clear from localStorage as well
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear session from localStorage:", error);
    }
  };

  const clearPhotos = () => {
    setPhotoSession((prev) => ({
      ...prev,
      photos: [],
      isComplete: false,
    }));
  };

  const hasActiveSession = () => {
    return photoSession.layout !== null && photoSession.photoCount > 0;
  };

  return (
    <PhotoContext.Provider
      value={{
        photoSession,
        startNewSession,
        addPhoto,
        resetSession,
        clearPhotos,
        hasActiveSession,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
};
