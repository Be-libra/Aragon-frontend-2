import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: "Aragon Kanban",
  description: "Task management MVP inspired by the Kanban challenge reference UI."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Runs synchronously before paint — prevents flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('aragon-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}})();`
          }}
        />
      </head>
      <body className={jetbrainsMono.variable}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
