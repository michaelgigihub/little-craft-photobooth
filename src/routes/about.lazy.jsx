import { createLazyFileRoute } from "@tanstack/react-router";
import Footer from "../components/Footer";

export const Route = createLazyFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="page-container">
      <div className="p-2">About Little Craft</div>
      <Footer />
    </div>
  );
}
