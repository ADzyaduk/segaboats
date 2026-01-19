export default defineAppConfig({
  // Nuxt UI Theme Configuration
  ui: {
    // Primary color - морской синий
    colors: {
      primary: 'blue',
      neutral: 'slate'
    },

    // Button - единые стили для всех кнопок
    button: {
      slots: {
        base: 'transition-all duration-200 font-medium'
      },
      variants: {
        size: {
          sm: { base: 'text-sm px-3 py-1.5' },
          md: { base: 'text-sm px-4 py-2' },
          lg: { base: 'text-base px-5 py-2.5' },
          xl: { base: 'text-lg px-6 py-3' }
        }
      }
    },

    // Card - единые стили для карточек
    card: {
      slots: {
        root: 'bg-white dark:bg-gray-900 ring-1 ring-gray-200 dark:ring-gray-800 rounded-xl overflow-hidden transition-all duration-300'
      }
    },

    // Badge - стили для бейджей
    badge: {
      slots: {
        base: 'font-medium'
      }
    },

    // Input - стили для полей ввода
    input: {
      slots: {
        root: 'transition-all duration-200'
      }
    }
  }
})
