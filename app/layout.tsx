import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "leafy-ai.local";
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProtocol === "http" || host.startsWith("localhost") ? "http" : "https";
  let metadataBase: URL;
  try {
    metadataBase = new URL(`${protocol}://${host}`);
  } catch {
    metadataBase = new URL("https://leafy-ai.local");
  }

  return {
    metadataBase,
    title: {
      default: "Leafy AI · Tradeshow Interactive Demo",
      template: "%s · Leafy AI Tradeshow",
    },
    description: "A guided, no-write replay with an operator-only surface for injecting synthetic farm state.",
    openGraph: {
      title: "Leafy AI · Tradeshow Interactive Demo",
      description: "Monitor. Explain. Validate. Approve. Audit.",
      type: "website",
      images: [{ url: new URL("/og.png", metadataBase).toString(), width: 1731, height: 909 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Leafy AI · Tradeshow Interactive Demo",
      description: "Monitor. Explain. Validate. Approve. Audit.",
      images: [new URL("/og.png", metadataBase).toString()],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
