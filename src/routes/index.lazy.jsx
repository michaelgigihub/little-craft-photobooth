import { createLazyFileRoute, Link } from "@tanstack/react-router";
import "../assets/css/index.lazy.css";
import layoutAImage from "../assets/images/layout-a.png";
import layoutBImage from "../assets/images/layout-b.png";
import layoutCImage from "../assets/images/layout-c.png";
import layoutDImage from "../assets/images/layout-d.png";

export const Route = createLazyFileRoute("/")({
  component: Index,
});

function Index() {
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
      photoCount: 6,
    },
  ];

  return (
    <div className="p-2">
      <h3>Choose your layout!</h3>
      <p>
        Please select a layout for your photo strip. Don't forget to smile and
        have fun!
      </p>
      <div className="layout-container">
        {layouts.map((layout) => (
          <div className="layout-item" key={layout.id}>
            <Link
              to="/photobooth"
              search={{ layout: layout.id, photoCount: layout.photoCount }}
              className="layout-link"
            >
              <img
                className="layout-image"
                src={layout.image}
                alt={layout.alt}
              />
              <div className="layout-info">{layout.photoCount} Photos</div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
