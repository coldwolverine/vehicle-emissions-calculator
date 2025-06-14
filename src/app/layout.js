import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Container from "@/components/container";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Vehicle Emissions Calculator",
  description: "Guiding consumer vehicle purchases",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable}  antialiased flex flex-col min-h-screen w-screen`}
      >
        <Header />
        <Container>
          <Hero />
          {children}
        </Container>
        <Footer />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
