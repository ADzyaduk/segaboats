// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/a11y',
    '@pinia/nuxt'
  ],

  // Runtime config для переменных окружения
  // В production Nuxt автоматически маппит переменные с префиксом NUXT_
  // NUXT_TELEGRAM_BOT_TOKEN → telegramBotToken
  // NUXT_PUBLIC_TELEGRAM_BOT_USERNAME → public.telegramBotUsername
  runtimeConfig: {
    // Серверные переменные (не доступны на клиенте)
    // В production Nuxt автоматически читает из NUXT_* переменных окружения
    // Значения по умолчанию используются только если переменные не установлены
    databaseUrl: process.env.DATABASE_URL,
    telegramBotToken: '', // Будет прочитано из NUXT_TELEGRAM_BOT_TOKEN в production
    telegramWebhookSecret: '', // Будет прочитано из NUXT_TELEGRAM_WEBHOOK_SECRET в production
    telegramAdminChatId: '413553084', // Будет прочитано из NUXT_TELEGRAM_ADMIN_CHAT_ID в production
    webhookUrl: process.env.WEBHOOK_URL || 'https://v-more.ru/webhook',
    webhookApiKey: process.env.WEBHOOK_API_KEY || '',
    adminPassword: process.env.ADMIN_PASSWORD || 'admin2026',

    // Публичные переменные (доступны на клиенте)
    public: {
      appName: 'В Море!',
      telegramBotUsername: 'SochiBoatsbot' // Будет прочитано из NUXT_PUBLIC_TELEGRAM_BOT_USERNAME в production
    }
  },

  // Настройки приложения
  app: {
    // Page transitions
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: {
        lang: 'ru'
      },
      title: 'В Море! - Аренда яхт в Сочи',
      titleTemplate: '%s | В Море!',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
        { name: 'description', content: 'Аренда яхт в Сочи - прогулки по морю, рыбалка, праздники. Онлайн бронирование яхт и катеров с капитаном.' },
        { name: 'keywords', content: 'аренда яхт, сочи, катера, катамараны, морские прогулки, рыбалка' },
        { name: 'author', content: 'В Море!' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'В Море!' },
        { property: 'og:locale', content: 'ru_RU' },
        { property: 'og:image', content: '/logo.png' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        // Standard favicon (for all browsers) - with cache busting to force refresh
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2' },
        { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico?v=2' },
        // Specify the actual size (120x120)
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2', sizes: '120x120' },
        // Additional standard sizes for compatibility (browsers will scale)
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2', sizes: '32x32' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico?v=2', sizes: '16x16' },
        // Apple touch icon (iOS) - 120x120 is perfect for this
        { rel: 'apple-touch-icon', href: '/favicon.ico?v=2', sizes: '120x120' }
      ]
    }
  },

  // Оптимизация
  experimental: {
    payloadExtraction: true,
    viewTransition: true
  },

  // Nitro optimization
  nitro: {
    compressPublicAssets: true,
    minify: true,
    prerender: {
      crawlLinks: true,
      routes: ['/']
    },
    experimental: {
      wasm: true
    }
  },

  // Performance optimizations
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router']
          }
        },
      },
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    ssr: {
      noExternal: ['@nuxt/ui']
    }
  },

  // Route rules
  routeRules: {
    // SSR для SEO
    '/': { prerender: true, isr: 3600 },
    '/boats': { swr: 1800, headers: { 'Cache-Control': 's-maxage=1800' } },
    '/boats/**': { swr: 3600, headers: { 'Cache-Control': 's-maxage=3600' } },
    // API routes
    '/api/**': { cors: true },
    // Static assets
    '/**/*.{jpg,jpeg,png,gif,svg,webp}': { headers: { 'Cache-Control': 's-maxage=31536000, immutable' } }
  },

  // Image optimization
  image: {
    quality: 80,
    format: ['webp', 'avif'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    presets: {
      boatThumbnail: {
        modifiers: {
          format: 'webp',
          quality: 80,
          width: 400,
          height: 300
        }
      },
      boatGallery: {
        modifiers: {
          format: 'webp',
          quality: 85,
          width: 1200,
          height: 800
        }
      }
    }
  },

  // Настройка CSS
  css: ['~/assets/css/main.css'],

  // Nuxt UI theme configuration
  ui: {
    primary: 'blue',
    gray: 'slate',
    global: true,
    // Отключаем автоматическую загрузку шрифтов из внешних источников
    fonts: false
  },

  // Отключаем все внешние провайдеры шрифтов
  fonts: {
    providers: {
      google: false,
      adobe: false,
      fontshare: false,
      bunny: false
    }
  },

  // Components configuration - auto-import from subdirectories
  components: [
    {
      path: '~/components',
      pathPrefix: false // This allows using components without their folder prefix
    }
  ]
})
