import "../polyfills";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";
import WalletProvider from "@/components/providers/WalletProvider";
import AnchorProvider from "@/components/providers/AnchorProvider";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: `${t("brand")} — ${t("tagline")}`,
    description: t("metaDescription"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root { --font-heading: 'Instrument Sans', sans-serif; }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <WalletProvider>
            <AnchorProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster
                richColors
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "#131A17",
                    border: "1px solid #1E2B26",
                    color: "#F0F5F3",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                  },
                }}
              />
            </AnchorProvider>
          </WalletProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
