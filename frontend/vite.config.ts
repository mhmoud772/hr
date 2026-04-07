import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const enablePwa = env.VITE_ENABLE_PWA === "true";

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    optimizeDeps: {
      include: ["@xyflow/react"],
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      enablePwa &&
        VitePWA({
          registerType: "autoUpdate",
          includeAssets: ["favicon.ico", "favicon.svg", "robots.txt"],
          manifest: {
            name: "HR Companion",
            short_name: "HR System",
            description: "Employee Self-Service & HR Management",
            theme_color: "#ffffff",
            background_color: "#ffffff",
            display: "standalone",
            icons: [
              {
                src: "favicon.svg",
                sizes: "192x192 512x512",
                type: "image/svg+xml",
                purpose: "any maskable",
              },
            ],
          },
          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,svg,png,jpg}"],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: "CacheFirst",
                options: {
                  cacheName: "google-fonts-cache",
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /\/api\//i,
                handler: "NetworkOnly",
                method: "POST",
                options: {
                  backgroundSync: {
                    name: "api-post-syncQueue",
                    options: {
                      maxRetentionTime: 24 * 60,
                    },
                  },
                },
              },
              {
                urlPattern: /\/api\//i,
                handler: "NetworkOnly",
                method: "PUT",
                options: {
                  backgroundSync: {
                    name: "api-put-syncQueue",
                    options: {
                      maxRetentionTime: 24 * 60,
                    },
                  },
                },
              },
              {
                urlPattern: /\/api\//i,
                handler: "NetworkOnly",
                method: "PATCH",
                options: {
                  backgroundSync: {
                    name: "api-patch-syncQueue",
                    options: {
                      maxRetentionTime: 24 * 60,
                    },
                  },
                },
              },
              {
                urlPattern: /\/api\//i,
                handler: "NetworkOnly",
                method: "DELETE",
                options: {
                  backgroundSync: {
                    name: "api-delete-syncQueue",
                    options: {
                      maxRetentionTime: 24 * 60,
                    },
                  },
                },
              },
              {
                urlPattern: /\/api\//i,
                handler: "NetworkFirst",
                method: "GET",
                options: {
                  cacheName: "api-cache",
                  networkTimeoutSeconds: 10,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          },
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor_html2canvas: ["html2canvas"],
            vendor_purify: ["dompurify"],
            vendor_zod: ["zod"],
            vendor_recharts: ["recharts"],
            vendor_xyflow: ["@xyflow/react"],
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  };
});
