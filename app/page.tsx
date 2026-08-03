import type { Metadata } from "next";
import { LeafyDashboard } from "./components/LeafyDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tradeshow Interactive Demo",
  description: "A guided, no-write Leafy AI journey with an operator-only demo backstage.",
};

export default function Home() {
  return <LeafyDashboard />;
}
