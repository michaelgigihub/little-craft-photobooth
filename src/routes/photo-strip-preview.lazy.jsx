import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/photo-strip-preview')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/photo-strip-preview"!</div>
}
