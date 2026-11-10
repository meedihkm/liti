/**
 * Détection d'appareil et de capacités — utilisé pour le mode léger automatique
 */

export interface DeviceCapabilities {
  isMobile: boolean
  isTouch: boolean
  isLowEnd: boolean
  prefersReducedMotion: boolean
  hasSaveData: boolean
}

/**
 * Détecte si l'appareil est mobile/tactile
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as Navigator & { msMaxTouchPoints?: number }).msMaxTouchPoints > 0
  )
}

/**
 * Détecte si l'appareil est faible en ressources
 */
export function isLowEndDevice(): boolean {
  if (typeof window === "undefined") return false
  
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency
  
  // < 4 GB RAM ou <= 4 cores
  return (mem !== undefined && mem <= 4) || (cores !== undefined && cores <= 4)
}

/**
 * Détecte prefers-reduced-motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Détecte Save-Data
 */
export function hasSaveDataEnabled(): boolean {
  if (typeof window === "undefined") return false
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return conn?.saveData === true
}

/**
 * Récupère toutes les capacités de l'appareil
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  const isTouch = isTouchDevice()
  return {
    isMobile: isTouch && window.innerWidth < 768,
    isTouch,
    isLowEnd: isLowEndDevice(),
    prefersReducedMotion: prefersReducedMotion(),
    hasSaveData: hasSaveDataEnabled(),
  }
}

/**
 * Détermine si le mode léger doit être activé
 */
export function shouldUseLightMode(): boolean {
  return prefersReducedMotion() || hasSaveDataEnabled() || isLowEndDevice()
}
