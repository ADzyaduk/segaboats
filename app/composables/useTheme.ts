// Theme management composable
// Handles both Telegram theme and web theme

export interface ThemeColors {
  primary: string
  primaryForeground: string
  background: string
  text: string
  secondary: string
  accent: string
  border: string
  card: string
  muted: string
}

export function useTheme() {
  const { isTelegram, themeParams, colorScheme } = useTelegram()
  
  // Telegram theme colors
  const telegramColors = computed<ThemeColors>(() => {
    const params = themeParams.value
    
    return {
      primary: params.button_color || '#3b82f6',
      primaryForeground: params.button_text_color || '#ffffff',
      background: params.bg_color || (colorScheme.value === 'dark' ? '#1a1a1a' : '#ffffff'),
      text: params.text_color || (colorScheme.value === 'dark' ? '#ffffff' : '#000000'),
      secondary: params.secondary_bg_color || (colorScheme.value === 'dark' ? '#2a2a2a' : '#f5f5f5'),
      accent: params.link_color || '#3b82f6',
      border: params.hint_color || (colorScheme.value === 'dark' ? '#404040' : '#e5e5e5'),
      card: params.secondary_bg_color || (colorScheme.value === 'dark' ? '#2a2a2a' : '#ffffff'),
      muted: params.hint_color || (colorScheme.value === 'dark' ? '#888888' : '#666666')
    }
  })

  // Web theme colors (unified theme)
  const webColors = computed<ThemeColors>(() => {
    const isDark = colorScheme.value === 'dark'
    
    return {
      primary: '#3b82f6', // blue-500
      primaryForeground: '#ffffff',
      background: isDark ? '#0f172a' : '#ffffff', // slate-900 / white
      text: isDark ? '#f1f5f9' : '#1e293b', // slate-100 / slate-800
      secondary: isDark ? '#1e293b' : '#f1f5f9', // slate-800 / slate-100
      accent: '#f59e0b', // amber-500
      border: isDark ? '#334155' : '#e2e8f0', // slate-700 / slate-200
      card: isDark ? '#1e293b' : '#ffffff', // slate-800 / white
      muted: isDark ? '#64748b' : '#94a3b8' // slate-500 / slate-400
    }
  })

  // Current theme colors (Telegram if in Telegram, web otherwise)
  const currentColors = computed<ThemeColors>(() => {
    return isTelegram.value ? telegramColors.value : webColors.value
  })

  // Apply theme to CSS variables
  const applyTheme = () => {
    if (typeof document === 'undefined') return

    const colors = currentColors.value
    const root = document.documentElement

    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-foreground', colors.primaryForeground)
    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-text', colors.text)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-accent', colors.accent)
    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-card', colors.card)
    root.style.setProperty('--color-muted', colors.muted)

    // Apply background color to body
    document.body.style.backgroundColor = colors.background
    document.body.style.color = colors.text
  }

  // Watch for theme changes
  watch([isTelegram, themeParams, colorScheme], () => {
    applyTheme()
  }, { immediate: true, deep: true })

  // Apply theme on mount
  if (typeof document !== 'undefined') {
    onMounted(() => {
      applyTheme()
    })
  }

  return {
    isTelegram,
    colorScheme,
    themeParams,
    telegramColors,
    webColors,
    currentColors,
    applyTheme
  }
}
