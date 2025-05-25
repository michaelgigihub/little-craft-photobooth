import React, { createContext, useContext, useState } from "react";

const PhotoContext = createContext();

export const usePhotoContext = () => {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error("usePhotoContext must be used within a PhotoProvider");
  }
  return context;
};

export const PhotoProvider = ({ children }) => {
  const [photoSession, setPhotoSession] = useState({
    layout: null,
    photoCount: 0,
    photos: [],
    isComplete: false,
  });

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
    setPhotoSession({
      layout: null,
      photoCount: 0,
      photos: [],
      isComplete: false,
    });
  };

  const clearPhotos = () => {
    setPhotoSession((prev) => ({
      ...prev,
      photos: [],
      isComplete: false,
    }));
  };

  return (
    <PhotoContext.Provider
      value={{
        photoSession,
        startNewSession,
        addPhoto,
        resetSession,
        clearPhotos,
      }}
    >
      {children}
    </PhotoContext.Provider>
  );
};
