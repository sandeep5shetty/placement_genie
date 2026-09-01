import { DM_Mono, DM_Sans } from "next/font/google";
import "./landing.css";

const dmSans = DM_Sans({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-landing-sans",
  weight: ["400", "500", "600"],
});

const dmMono = DM_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-landing-mono",
  weight: ["400", "500"],
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${dmSans.variable} ${dmMono.variable} landing-root`}>
      {children}
    </div>
  );
}
