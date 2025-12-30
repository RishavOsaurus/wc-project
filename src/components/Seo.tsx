import { useEffect } from 'react';
import type { ReactNode } from 'react';

type SeoProps = {
  title: string;
  description: string;
  url?: string;
  image?: string;
  keywords?: string;
  children?: ReactNode; // optional JSON-LD or extras
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  if (!content) return;
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function Seo({ title, description, url = '/', image = '/image.png', keywords }: SeoProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    upsertMeta('name', 'description', description);
    if (keywords) upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'author', 'WorldCup Replica');
    upsertMeta('name', 'theme-color', '#ffffff');

    // Open Graph
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);

    // Twitter
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    // canonical link
    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // JSON-LD (simple WebPage entry)
    const ldId = 'seo-json-ld';
    let ld = document.getElementById(ldId) as HTMLScriptElement | null;
    const ldObj = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      'name': title,
      'description': description,
      'url': url,
    };
    if (!ld) {
      ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.id = ldId;
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(ldObj);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, url, image, keywords]);

  return null;
}
