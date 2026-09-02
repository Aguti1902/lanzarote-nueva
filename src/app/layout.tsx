import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { CartProvider } from "@/components/CartProvider";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lanzarote Experience Tours - Visitas guiadas en Lanzarote",
    template: "%s | Lanzarote Experience Tours",
  },
  description:
    "Somos Lanzarote Experience Tours, una empresa familiar y local. Organizamos visitas guiadas en Lanzarote sin intermediarios, en Español y en grupos reducidos (máx 14 personas).",
  other: {
    "theme-color": "#eb4823",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${syne.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
