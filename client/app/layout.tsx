import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastContainer } from "react-toastify";
import "./globals.css";
import Navigation from "../components/Navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Glacier Pro | High-Fidelity LMS Dashboard",
  description: "Advanced LMS dashboard interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} dark antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body-md overflow-x-hidden selection:bg-gold-accent/30 min-h-screen">
        <Navigation>
          {children}
        </Navigation>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="glass-card border-l-4 border-gold-accent !bg-navy-accent/50"
        />
      </body>
    </html>
  );
}

