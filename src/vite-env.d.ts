export {}

declare global {
  /** Injected by Vite from package.json at compile time. */
  const __APP_VERSION__: string

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
