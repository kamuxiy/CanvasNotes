import { useCallback, useEffect, useState } from 'react'
import { APP_META } from '../appMeta'
import { checkForUpdates, type UpdateCheckResult } from '../utils/checkUpdate'

type SettingsPage = 'about'

type Props = {
  open: boolean
  onClose: () => void
}

const NAV: { id: SettingsPage; label: string }[] = [{ id: 'about', label: '关于' }]

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function UpdateStatus({ result, checking }: { result: UpdateCheckResult | null; checking: boolean }) {
  if (checking) {
    return <p className="settings-update-status is-checking">正在检查更新…</p>
  }
  if (!result) {
    return <p className="settings-update-status is-muted">点击上方按钮，与 GitHub Release 比对版本</p>
  }
  if (result.status === 'offline') {
    return <p className="settings-update-status is-offline">无网络</p>
  }
  if (result.status === 'error') {
    return <p className="settings-update-status is-error">检查失败：{result.message}</p>
  }
  if (result.status === 'latest') {
    return (
      <p className="settings-update-status is-latest">
        当前已是最新版本（v{result.current}）
      </p>
    )
  }
  if (result.status === 'ahead') {
    return (
      <p className="settings-update-status is-latest">
        当前版本 v{result.current} 新于最新 Release（v{result.latest}）
      </p>
    )
  }
  return (
    <p className="settings-update-status is-outdated">
      发现新版本 v{result.latest}（当前 v{result.current}）
      <button
        type="button"
        className="settings-link-btn"
        onClick={() => openExternal(result.htmlUrl)}
      >
        前往下载
      </button>
    </p>
  )
}

function AboutPage() {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<UpdateCheckResult | null>(null)

  const runCheck = useCallback(async () => {
    setChecking(true)
    setResult(null)
    const next = await checkForUpdates()
    setResult(next)
    setChecking(false)
  }, [])

  return (
    <div className="settings-about">
      <header className="settings-about-hero">
        <div className="settings-about-mark" aria-hidden>
          CN
        </div>
        <div>
          <h3>{APP_META.displayName}</h3>
          <p>{APP_META.productName}</p>
        </div>
      </header>

      <dl className="settings-meta-list">
        <div>
          <dt>项目名称</dt>
          <dd>
            {APP_META.displayName}（{APP_META.productName}）
          </dd>
        </div>
        <div>
          <dt>作者</dt>
          <dd>{APP_META.author}</dd>
        </div>
        <div>
          <dt>项目 GitHub</dt>
          <dd>
            <button
              type="button"
              className="settings-link-btn"
              onClick={() => openExternal(APP_META.githubUrl)}
            >
              {APP_META.githubUrl}
            </button>
          </dd>
        </div>
        <div>
          <dt>当前版本</dt>
          <dd>v{APP_META.version}</dd>
        </div>
      </dl>

      <section className="settings-section">
        <h4>编程环境</h4>
        <ul className="settings-stack-list">
          {APP_META.stack.map((item) => (
            <li key={item.name}>
              <span>{item.name}</span>
              <code>{item.version}</code>
            </li>
          ))}
        </ul>
      </section>

      <section className="settings-section">
        <h4>检查更新</h4>
        <p className="settings-update-hint">与 GitHub Release 最新版本比对；无网络时显示「无网络」。</p>
        <button
          type="button"
          className="tool-btn primary"
          disabled={checking}
          onClick={() => void runCheck()}
        >
          {checking ? '检查中…' : '检查更新'}
        </button>
        <UpdateStatus result={result} checking={checking} />
      </section>
    </div>
  )
}

export function SettingsModal({ open, onClose }: Props) {
  const [page, setPage] = useState<SettingsPage>('about')

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="settings-backdrop"
      role="presentation"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <aside className="settings-sidebar">
          <div className="settings-sidebar-title">设置</div>
          <nav className="settings-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`settings-nav-item${page === item.id ? ' active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <div className="settings-main">
          <div className="settings-main-head">
            <strong>{NAV.find((n) => n.id === page)?.label ?? '设置'}</strong>
            <button type="button" className="ghost-btn" onClick={onClose}>
              关闭
            </button>
          </div>
          <div className="settings-main-body">
            {page === 'about' && <AboutPage />}
          </div>
        </div>
      </div>
    </div>
  )
}
