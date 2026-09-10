import { useMemo, useRef, useState } from 'react'
import type { AppState, WorkspaceDocument, WorkspaceMeta } from '../types'
import {
  createWorkspace,
  downloadText,
  exportWorkspaceJson,
  getActiveWorkspaceId,
  listRecent,
  listWorkspaceIndex,
  loadWorkspaceDoc,
  parseWorkspaceJson,
  saveWorkspaceDoc,
  setActiveWorkspaceId,
} from '../store'

type Props = {
  currentState: AppState
  onLoadState: (state: AppState) => void
}

export function WorkspaceSwitcher({ currentState, onLoadState }: Props) {
  const [open, setOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = () => setTick((t) => t + 1)
  const index = useMemo(() => listWorkspaceIndex(), [tick, open])
  const recentIds = useMemo(() => listRecent(), [tick, open])
  const activeId = getActiveWorkspaceId()
  const active = index.find((w) => w.id === activeId) ?? null

  const persistCurrent = (name?: string) => {
    const id = activeId
    if (id) {
      const existing = loadWorkspaceDoc(id)
      const doc: WorkspaceDocument = {
        version: 1,
        id,
        name: name ?? existing?.name ?? '未命名工作区',
        updatedAt: Date.now(),
        state: currentState,
      }
      saveWorkspaceDoc(doc)
    } else {
      createWorkspace(name ?? '未命名工作区', currentState)
    }
    refresh()
  }

  const switchTo = (id: string) => {
    persistCurrent()
    const doc = loadWorkspaceDoc(id)
    if (!doc) return
    setActiveWorkspaceId(id)
    onLoadState(doc.state)
    refresh()
    setOpen(false)
  }

  const createNew = () => {
    persistCurrent()
    const name = window.prompt('新工作区名称', `工作区 ${index.length + 1}`)
    if (!name?.trim()) return
    const doc = createWorkspace(name.trim(), {
      nodes: [],
      connections: [],
      viewport: { x: 80, y: 60, zoom: 1 },
    })
    onLoadState(doc.state)
    refresh()
    setOpen(false)
  }

  const renameActive = () => {
    if (!active) return
    const name = window.prompt('重命名工作区', active.name)
    if (!name?.trim()) return
    persistCurrent(name.trim())
  }

  const exportActive = () => {
    persistCurrent()
    const id = getActiveWorkspaceId()
    const doc = id ? loadWorkspaceDoc(id) : null
    if (!doc) {
      const fallback = createWorkspace('导出工作区', currentState)
      downloadText(`${fallback.name}.canvasnotes.json`, exportWorkspaceJson(fallback))
      return
    }
    downloadText(`${doc.name}.canvasnotes.json`, exportWorkspaceJson(doc))
  }

  const importFile = async (file: File) => {
    const text = await file.text()
    const parsed = parseWorkspaceJson(text)
    if (!parsed) {
      window.alert('无法解析工作区文件')
      return
    }
    persistCurrent()
    saveWorkspaceDoc(parsed)
    setActiveWorkspaceId(parsed.id)
    onLoadState(parsed.state)
    refresh()
    setOpen(false)
  }

  const recentMetas: WorkspaceMeta[] = recentIds
    .map((id) => index.find((w) => w.id === id))
    .filter(Boolean) as WorkspaceMeta[]

  return (
    <div className="workspace-switcher" onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={`dock-btn${open ? ' active' : ''}`}
        title="工作区"
        onClick={() => {
          persistCurrent()
          setOpen((v) => !v)
          refresh()
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 7h7l2 2h9v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
        <span>{active?.name ?? '工作区'}</span>
      </button>

      {open && (
        <div className="workspace-menu">
          <div className="workspace-menu-head">
            <strong>工作区</strong>
            <button type="button" className="ghost-btn" onClick={() => setOpen(false)}>
              关闭
            </button>
          </div>

          {recentMetas.length > 0 && (
            <div className="workspace-section">
              <div className="workspace-section-title">最近使用</div>
              {recentMetas.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`workspace-item${w.id === activeId ? ' active' : ''}`}
                  onClick={() => switchTo(w.id)}
                >
                  <span>{w.name}</span>
                  <small>{new Date(w.updatedAt).toLocaleString()}</small>
                </button>
              ))}
            </div>
          )}

          <div className="workspace-section">
            <div className="workspace-section-title">全部</div>
            {index.length === 0 && <div className="workspace-empty">暂无已保存工作区</div>}
            {index.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`workspace-item${w.id === activeId ? ' active' : ''}`}
                onClick={() => switchTo(w.id)}
              >
                <span>{w.name}</span>
                <small>{new Date(w.updatedAt).toLocaleString()}</small>
              </button>
            ))}
          </div>

          <div className="workspace-menu-actions">
            <button type="button" className="tool-btn primary" onClick={createNew}>
              新建
            </button>
            <button type="button" className="tool-btn" onClick={renameActive} disabled={!active}>
              重命名
            </button>
            <button type="button" className="tool-btn" onClick={exportActive}>
              导出
            </button>
            <button type="button" className="tool-btn" onClick={() => fileRef.current?.click()}>
              导入
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,.canvasnotes.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
        </div>
      )}
    </div>
  )
}
