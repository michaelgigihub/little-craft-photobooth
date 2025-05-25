import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/privacy-policy")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <h3>We value your privacy.</h3>
      <p>
        All photos and data captured using this photobooth are not stored on any
        external database or server. Everything is processed locally on your
        device and remains there. This ensures that your personal data stays
        private and secure.
        <br />
        So do not worry, your secrets are safe-even from nosy cats!
      </p>
    </div>
  );
}
