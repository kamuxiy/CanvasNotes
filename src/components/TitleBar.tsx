type TitleBarProps = {
  onMinimize?: () => void
  onMaximize?: () => void
  onClose?: () => void
}

export function TitleBar({ onMinimize, onMaximize, onClose }: TitleBarProps) {
  const desktop = typeof window !== 'undefined' ? window.desktop : undefined

  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-brand">
          <span className="titlebar-mark" aria-hidden />
          <span>Canvas Notes</span>
        </div>
      </div>
      <div className="titlebar-center">
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          画布笔记 · Upload Labs 画面风格
        </span>
      </div>
      <div className="titlebar-right">
        <div className="window-controls" aria-label="窗口控制">
          <button
            type="button"
            className="window-btn min"
            title="最小化"
            aria-label="最小化"
            onClick={() => {
              if (desktop?.isDesktop) void desktop.minimize()
              else onMinimize?.()
            }}
          />
          <button
            type="button"
            className="window-btn max"
            title="最大化"
            aria-label="最大化"
            onClick={() => {
              if (desktop?.isDesktop) void desktop.maximize()
              else onMaximize?.()
            }}
          />
          <button
            type="button"
            className="window-btn close"
            title="关闭"
            aria-label="关闭"
            onClick={() => {
              if (desktop?.isDesktop) void desktop.close()
              else onClose?.()
            }}
          />
        </div>
      </div>
    </header>
  )
}
