import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { usePhotoContext } from "../context/PhotoContext";
import "../assets/css/index.lazy.css";
import layoutAImage from "../assets/images/layout-a.png";
import layoutBImage from "../assets/images/layout-b.png";
import layoutCImage from "../assets/images/layout-c.png";
import layoutDImage from "../assets/images/layout-d.png";
import Footer from "../components/Footer";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { startNewSession } = usePhotoContext();

  // Layout configurations with image count
  const layouts = [
    {
      id: "a",
      image: layoutAImage,
      alt: "Photo Strip Example A",
      photoCount: 4,
    },
    {
      id: "b",
      image: layoutBImage,
      alt: "Photo Strip Example B",
      photoCount: 3,
    },
    {
      id: "c",
      image: layoutCImage,
      alt: "Photo Strip Example C",
      photoCount: 2,
    },
    {
      id: "d",
      image: layoutDImage,
      alt: "Photo Strip Example D",
      photoCount: 2,
    },
  ];

  const handleLayoutSelect = (layout) => {
    startNewSession(layout.id, layout.photoCount);
    navigate({ to: "/photobooth" });
  };

  return (
    <div className="page-container index-page">
      <div className="p-2">
        <h2>Choose your layout!</h2>
        <p>
          Please select a layout for your photo strip. Don't forget to smile and
          have fun!
        </p>
        <div className="layout-container">
          {layouts.map((layout) => (
            <div className="layout-item" key={layout.id}>
              <button
                onClick={() => handleLayoutSelect(layout)}
                className="layout-link"
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <img
                  className="layout-image"
                  src={layout.image}
                  alt={layout.alt}
                />
                <div className="layout-info">
                  {layout.photoCount} Photos
                  {layout.id === "c" && (
                    <div className="layout-ratio">{"(2:6 ratio)"}</div>
                  )}
                  {layout.id === "d" && (
                    <div className="layout-ratio">{"(4:6 ratio)"}</div>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
