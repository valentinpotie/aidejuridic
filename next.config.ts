import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
    };
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'none'",
              "connect-src 'self' https://chatgpt.com https://sentinel.openai.com https://*.oaiusercontent.com https://api.openai.com https://browser-intake-datadoghq.com https://api-js.mixpanel.com https://*.supabase.co",
              "frame-src 'self' https://chatgpt.com https://sentinel.openai.com https://cdn.platform.openai.com",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://chatgpt.com https://sentinel.openai.com https://cdn.platform.openai.com",
              "font-src 'self' https://cdn.openai.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "report-uri /api/csp-report"
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'fullscreen=(self https://cdn.platform.openai.com https://sentinel.openai.com)'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
