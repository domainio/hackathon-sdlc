import { useState, useEffect } from 'react'

interface BreakpointConfig {
  xs: number
  sm: number
  md: number
  lg: number
  xl: number
}

interface ScreenSize {
  width: number
  height: number
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLandscape: boolean
  isPortrait: boolean
}

const defaultBreakpoints: BreakpointConfig = {
  xs: 480,   // 30em
  sm: 768,   // 48em
  md: 1024,  // 64em
  lg: 1280,  // 80em
  xl: 1536,  // 96em
}

/**
 * Custom hook for responsive design utilities
 * Returns screen size information and breakpoint detection
 */
export function useResponsive(breakpoints: BreakpointConfig = defaultBreakpoints): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    // Handle SSR case
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        isXs: false,
        isSm: false,
        isMd: false,
        isLg: false,
        isXl: false,
        isMobile: false,
        isTablet: false,
        isDesktop: false,
        isLandscape: false,
        isPortrait: true,
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight

    return {
      width,
      height,
      isXs: width < breakpoints.xs,
      isSm: width >= breakpoints.xs && width < breakpoints.sm,
      isMd: width >= breakpoints.sm && width < breakpoints.md,
      isLg: width >= breakpoints.md && width < breakpoints.lg,
      isXl: width >= breakpoints.lg,
      isMobile: width < breakpoints.sm,
      isTablet: width >= breakpoints.sm && width < breakpoints.md,
      isDesktop: width >= breakpoints.md,
      isLandscape: width > height,
      isPortrait: width <= height,
    }
  })

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      // Debounce resize events for performance
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const width = window.innerWidth
        const height = window.innerHeight

        setScreenSize({
          width,
          height,
          isXs: width < breakpoints.xs,
          isSm: width >= breakpoints.xs && width < breakpoints.sm,
          isMd: width >= breakpoints.sm && width < breakpoints.md,
          isLg: width >= breakpoints.md && width < breakpoints.lg,
          isXl: width >= breakpoints.lg,
          isMobile: width < breakpoints.sm,
          isTablet: width >= breakpoints.sm && width < breakpoints.md,
          isDesktop: width >= breakpoints.md,
          isLandscape: width > height,
          isPortrait: width <= height,
        })
      }, 100)
    }

    // Use ResizeObserver if available for better performance
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(document.documentElement)
      
      return () => {
        clearTimeout(timeoutId)
        resizeObserver.disconnect()
      }
    }

    // Fallback to resize event listener
    window.addEventListener('resize', handleResize, { passive: true })
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoints])

  return screenSize
}

/**
 * Hook to detect if the user is on a mobile device
 * More accurate than just screen size - also checks user agent
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
      const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword))
      const isMobileScreen = window.innerWidth < 768
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setIsMobile(isMobileUA || (isMobileScreen && hasTouchScreen))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile, { passive: true })
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

/**
 * Hook to detect device orientation
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait'
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  })

  useEffect(() => {
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(() => {
        setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
      }, 100)
    }

    // Listen for both resize and orientationchange events
    window.addEventListener('resize', handleOrientationChange, { passive: true })
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true })
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return orientation
}

/**
 * Hook to get safe area insets for devices with notches/rounded corners
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement)
      
      setSafeArea({
        top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
        right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
        left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0'),
      })
    }

    updateSafeArea()
    window.addEventListener('resize', updateSafeArea, { passive: true })
    window.addEventListener('orientationchange', updateSafeArea, { passive: true })
    
    return () => {
      window.removeEventListener('resize', updateSafeArea)
      window.removeEventListener('orientationchange', updateSafeArea)
    }
  }, [])

  return safeArea
}