export function TitleBar() {
  const desktop = typeof window !== 'undefined' ? window.desktop : undefined

  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <div className="titlebar-brand">
          <span className="titlebar-mark" aria-hidden />
          <span>画布笔记</span>
        </div>
      </div>
      <div className="titlebar-center">
        <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
          Canvas Notes · 桌面客户端
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
              void desktop?.minimize()
            }}
          />
          <button
            type="button"
            className="window-btn max"
            title="最大化"
            aria-label="最大化"
            onClick={() => {
              void desktop?.maximize()
            }}
          />
          <button
            type="button"
            className="window-btn close"
            title="关闭"
            aria-label="关闭"
            onClick={() => {
              void desktop?.close()
            }}
          />
        </div>
      </div>
    </header>
  )
}
