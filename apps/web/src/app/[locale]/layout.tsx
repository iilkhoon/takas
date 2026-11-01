import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/Providers';
import { Header, MobileNav } from '@/components/Header';
import { Footer } from '@/components/Footer';
import '@fontsource-variable/unbounded';
import '@fontsource-variable/manrope';
import '../globals.css';


const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brand' });
  return {
    metadataBase: new URL(SITE),
    title: { default: `Dəyiş — ${t('tagline')}`, template: '%s · Dəyiş' },
    description: t('description'),
    applicationName: 'Dəyiş',
    keywords: ['takas', 'barter', 'dəyiş', 'swap', 'Azərbaycan', 'Bakı', 'ikinci əl', 'обмен', 'бартер', 'takas Azerbaycan'],
    alternates: {
      canonical: locale === 'az' ? '/' : `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, l === 'az' ? '/' : `/${l}`])),
    },
    openGraph: {
      type: 'website',
      siteName: 'Dəyiş',
      title: `Dəyiş — ${t('slogan')}`,
      description: t('description'),
      locale,
    },
    twitter: { card: 'summary_large_image' },
    manifest: '/manifest.webmanifest',
  };
}

export const viewport: Viewport = {
  themeColor: '#E8334A',
  width: 'device-width',
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const adsense = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body className="flex min-h-screen flex-col">
        {adsense && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense}`}
            crossOrigin="anonymous"
          />
        )}
        <NextIntlClientProvider>
          <Providers>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <MobileNav />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
