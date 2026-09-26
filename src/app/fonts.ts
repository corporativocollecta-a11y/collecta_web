import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

/* Brand fonts, shared by the site and the legal pages (each has its own root layout). */
export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const fontVars = `${geistSans.variable} ${geistMono.variable} ${instrument.variable}`;
