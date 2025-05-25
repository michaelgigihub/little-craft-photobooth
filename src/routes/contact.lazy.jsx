import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/contact")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello "/contact"!
      <p>
        Having trouble sending the message? you can also reach us at:{" "}
        <a href="mailto:someone@example.com">someone@example.com</a>
      </p>
    </div>
  );
}
