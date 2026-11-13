import type { NextConfig } from 'next';

// Cabeçalhos de segurança (SEG-06). A CSP ainda permite 'unsafe-inline' porque o Next
// injeta scripts inline na hidratação; endurecer com hashes/nonce está em 10-pendencias.
const cabecalhos = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const config: NextConfig = {
  // Não anunciar o framework (barreira 3b).
  poweredByHeader: false,
  reactStrictMode: true,
  // O otimizador de imagens do Next acumula CVEs e roda no servidor. Imagens do portal
  // (fotos oficiais dos deputados) são servidas como estão (DEC-12, superfície mínima).
  images: { unoptimized: true },
  // Pacotes internos do monorepo são TypeScript puro.
  transpilePackages: ['@portal/sources'],
  async headers() {
    return [{ source: '/:path*', headers: cabecalhos }];
  },
};

export default config;
