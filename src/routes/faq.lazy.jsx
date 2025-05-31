import { createLazyFileRoute } from "@tanstack/react-router";
import Footer from "../components/Footer";

export const Route = createLazyFileRoute("/faq")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="page-container">
      <div>Hello "/faq"!</div>
      <Footer />
    </div>
  );
}
