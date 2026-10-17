const DASHBOARD_THEME_KEY = 'dashboardTheme'

function applyDashboardTheme(theme) {
  document.documentElement.style.setProperty('--brand-primary', theme.primary)
  document.documentElement.style.setProperty('--brand-secondary', theme.secondary)
}

export function themeFromSettings(settings) {
  const primary = settings.primary_color || settings.primaryColor || settings.primary
  const secondary =
    settings.secondary_color || settings.secondaryColor || settings.secondary

  if (
    typeof primary !== 'string' ||
    !CSS.supports('color', primary) ||
    typeof secondary !== 'string' ||
    !CSS.supports('color', secondary)
  ) {
    throw new Error('Set valid primary and secondary colors in Hotel Settings.')
  }

  return { primary, secondary }
}

export function storeDashboardTheme(theme) {
  sessionStorage.setItem(DASHBOARD_THEME_KEY, JSON.stringify(theme))
  applyDashboardTheme(theme)
}

export function readDashboardTheme() {
  try {
    const storedTheme = JSON.parse(sessionStorage.getItem(DASHBOARD_THEME_KEY) || 'null')
    if (
      storedTheme &&
      typeof storedTheme.primary === 'string' &&
      CSS.supports('color', storedTheme.primary) &&
      typeof storedTheme.secondary === 'string' &&
      CSS.supports('color', storedTheme.secondary)
    ) {
      applyDashboardTheme(storedTheme)
      return storedTheme
    }
  } catch (error) {
    console.error('Could not read the saved dashboard theme:', error)
  }
  return null
}

export function clearDashboardTheme() {
  sessionStorage.removeItem(DASHBOARD_THEME_KEY)
  document.documentElement.style.removeProperty('--brand-primary')
  document.documentElement.style.removeProperty('--brand-secondary')
}
