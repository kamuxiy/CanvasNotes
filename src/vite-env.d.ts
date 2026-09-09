export {}

declare global {
  interface Window {
    desktop?: {
      isDesktop: boolean
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      isMaximized: () => Promise<boolean>
    }
  }
}
