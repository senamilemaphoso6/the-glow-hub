import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-7xl font-semibold text-primary">404</div>
        <h2 className="mt-4 font-display text-xl font-semibold">This page wandered off</h2>
        <p className="mt-2 text-sm text-muted-foreground">The link you followed doesn't exist anymore.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Back to the feed
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Something didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <a href="/" className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">Go home</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Glow Hub — Self-care, together" },
      { name: "description", content: "A warm community platform for women to share self-care wisdom: blogs, skincare recipes, wellness routines, and quick tips." },
      { property: "og:title", content: "The Glow Hub — Self-care, together" },
      { property: "og:description", content: "A warm community platform for women to share self-care wisdom: blogs, skincare recipes, wellness routines, and quick tips." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "The Glow Hub — Self-care, together" },
      { name: "twitter:description", content: "A warm community platform for women to share self-care wisdom: blogs, skincare recipes, wellness routines, and quick tips." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/0de3ef44-708d-431e-a44c-e33e1f1caccb" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/0de3ef44-708d-431e-a44c-e33e1f1caccb" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1"><Outlet /></main>
          <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
            Made with care · The Glow Hub
          </footer>
        </div>
        <Toaster richColors closeButton position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
