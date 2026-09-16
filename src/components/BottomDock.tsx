import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { NodeKind, ToolMode } from '../types'
import { GROUP_COLOR_PRESETS } from '../types'

type Props = {
  toolMode: ToolMode
  onToolModeChange: (mode: ToolMode) => void
  onAdd: (kind: NodeKind) => void
  selectedCount: number
  singleSelected: boolean
  singleGroupSelected: boolean
  singleNonGroupSelected: boolean
  groupTitle?: string
  onGroupTitle?: (title: string) => void
  onDelete: () => void
  onDuplicate: () => void
  onAddSocketLeft: () => void
  onAddSocketRight: () => void
  onOpenSocketManager: () => void
  groupColor?: string
  onGroupColor?: (color: string) => void
  workspaceSlot: ReactNode
  onFit: () => void
  onSeed: () => void
  onClear: () => void
  onOpenSettings: () => void
}

type DockMenu = 'pointer' | 'create' | 'ops' | null

function IconNote() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4h7l4 4v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M14 4v4h4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconDate() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconList() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 7h11M9 12h11M9 17h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="5" cy="17" r="1.2" fill="currentColor" />
    </svg>
  )
}

function IconMarkdown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M7 15V9l2.5 3L12 9v6M15 12.5V15h2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconGroup() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9h18" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 8h14M10 11v6M14 11v6M8 8V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M7 8l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCopy() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="8" y="8" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 15V5a1 1 0 0 1 1-1h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconFit() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconSelect() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4l6.5 15 1.8-6.2L19.5 11 5 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconMarquee() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="3 2.5"
      />
    </svg>
  )
}

function IconSeed() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v16M8 8c0-2.5 1.8-4 4-4s4 1.5 4 4c0 4-4 5-4 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M9 20h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconClear() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M8 7l1 13h6l1-13M10 7V5h4v2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconManage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 7h14M5 12h14M5 17h10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="18" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

function IconPointerMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4l6.5 15 1.8-6.2L19.5 11 5 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconCreateMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function IconOpsMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="18" cy="12" r="1.6" fill="currentColor" />
    </svg>
  )
}


function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 13a7.8 7.8 0 0 0 .1-2l2-1.2-2-3.4-2.3.6a7.6 7.6 0 0 0-1.7-1L15 3.5h-4l-.5 2.5a7.6 7.6 0 0 0-1.7 1L6.5 6.4l-2 3.4 2 1.2a7.8 7.8 0 0 0 0 2l-2 1.2 2 3.4 2.3-.6a7.6 7.6 0 0 0 1.7 1l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 1.7-1l2.3.6 2-3.4-2-1.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function BottomDock({
  toolMode,
  onToolModeChange,
  onAdd,
  selectedCount,
  singleSelected,
  singleGroupSelected,
  singleNonGroupSelected,
  groupTitle,
  onGroupTitle,
  onDelete,
  onDuplicate,
  onAddSocketLeft,
  onAddSocketRight,
  onOpenSocketManager,
  groupColor,
  onGroupColor,
  workspaceSlot,
  onFit,
  onSeed,
  onClear,
  onOpenSettings,
}: Props) {
  const hasSelection = selectedCount > 0
  const dockRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [compact, setCompact] = useState(false)
  const [openMenu, setOpenMenu] = useState<DockMenu>(null)

  useLayoutEffect(() => {
    const dock = dockRef.current
    const measure = measureRef.current
    if (!dock || !measure) return

    const check = () => {
      const available = dock.clientWidth
      const needed = measure.scrollWidth
      // Keep some breathing room so the dock never clips
      const next = needed > available - 8
      setCompact(next)
      if (!next) setOpenMenu(null)
    }

    check()
    const ro = new ResizeObserver(check)
    ro.observe(dock)
    ro.observe(measure)
    return () => ro.disconnect()
  }, [hasSelection, singleGroupSelected, singleNonGroupSelected, selectedCount])

  useEffect(() => {
    if (!openMenu) return
    const onDoc = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('.dock-menu-wrap') && !t.closest('.dock-overflow-btn')) {
        setOpenMenu(null)
      }
    }
    window.addEventListener('pointerdown', onDoc)
    return () => window.removeEventListener('pointerdown', onDoc)
  }, [openMenu])

  const renderOpsItems = (interactive: boolean) => (
    <>
      <button
        type="button"
        className="dock-btn"
        onClick={interactive ? onFit : undefined}
        title={interactive ? '适应画布' : undefined}
        tabIndex={interactive ? undefined : -1}
      >
        <IconFit />
        <span>适应</span>
      </button>
      <button
        type="button"
        className="dock-btn dock-btn-ghost"
        onClick={interactive ? onSeed : undefined}
        title={interactive ? '载入示例' : undefined}
        tabIndex={interactive ? undefined : -1}
      >
        <IconSeed />
        <span>示例</span>
      </button>
      <button
        type="button"
        className="dock-btn dock-btn-ghost"
        onClick={interactive ? onClear : undefined}
        title={interactive ? '清空画布' : undefined}
        tabIndex={interactive ? undefined : -1}
      >
        <IconClear />
        <span>清空</span>
      </button>
      {hasSelection && (
        <>
          <button
            type="button"
            className="dock-btn dock-btn-danger"
            onClick={interactive ? onDelete : undefined}
            title={interactive ? '删除选中' : undefined}
            tabIndex={interactive ? undefined : -1}
          >
            <IconTrash />
            <span>删除</span>
          </button>
          <button
            type="button"
            className="dock-btn"
            onClick={interactive ? onDuplicate : undefined}
            title={interactive ? '复制选中' : undefined}
            tabIndex={interactive ? undefined : -1}
          >
            <IconCopy />
            <span>复制</span>
          </button>
          {singleSelected && singleNonGroupSelected && (
            <>
              <button
                type="button"
                className="dock-btn"
                onClick={interactive ? onAddSocketLeft : undefined}
                title={interactive ? '左侧添加连接点' : undefined}
                tabIndex={interactive ? undefined : -1}
              >
                <IconPlus />
                <span>+左</span>
              </button>
              <button
                type="button"
                className="dock-btn"
                onClick={interactive ? onAddSocketRight : undefined}
                title={interactive ? '右侧添加连接点' : undefined}
                tabIndex={interactive ? undefined : -1}
              >
                <IconPlus />
                <span>+右</span>
              </button>
              <button
                type="button"
                className="dock-btn"
                data-testid={interactive ? 'dock-socket-manager' : undefined}
                onPointerDown={
                  interactive
                    ? (e) => {
                        e.stopPropagation()
                      }
                    : undefined
                }
                onClick={
                  interactive
                    ? (e) => {
                        e.stopPropagation()
                        onOpenSocketManager()
                      }
                    : undefined
                }
                title={interactive ? '节点管理' : undefined}
                tabIndex={interactive ? undefined : -1}
              >
                <IconManage />
                <span>节点管理</span>
              </button>
            </>
          )}
          {singleGroupSelected && onGroupTitle && (
            <label className="dock-group-title">
              <span>标题</span>
              <input
                value={groupTitle ?? ''}
                onChange={interactive ? (e) => onGroupTitle(e.target.value) : undefined}
                placeholder="分组标题"
                tabIndex={interactive ? undefined : -1}
                readOnly={!interactive}
              />
            </label>
          )}
          {singleGroupSelected && onGroupColor && (
            <div className="dock-color-swatches">
              {GROUP_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-swatch${groupColor === color ? ' active' : ''}`}
                  style={{ background: color }}
                  title={interactive ? '分组颜色' : undefined}
                  onClick={interactive ? () => onGroupColor(color) : undefined}
                  tabIndex={interactive ? undefined : -1}
                />
              ))}
            </div>
          )}
          <span className="dock-selection-hint">{selectedCount} 项</span>
        </>
      )}
    </>
  )

  const pointerItems = (
    <>
      <button
        type="button"
        className={`dock-btn${toolMode === 'select' ? ' active' : ''}`}
        onClick={() => onToolModeChange('select')}
        title="选择模式"
      >
        <IconSelect />
        <span>选择</span>
      </button>
      <button
        type="button"
        className={`dock-btn${toolMode === 'marquee' ? ' active' : ''}`}
        onClick={() => onToolModeChange('marquee')}
        title="框选模式"
      >
        <IconMarquee />
        <span>框选</span>
      </button>
    </>
  )

  const createItems = (
    <>
      <button type="button" className="dock-btn" onClick={() => onAdd('note')} title="便签">
        <IconNote />
        <span>便签</span>
      </button>
      <button type="button" className="dock-btn" onClick={() => onAdd('date')} title="日期">
        <IconDate />
        <span>日期</span>
      </button>
      <button type="button" className="dock-btn" onClick={() => onAdd('list')} title="清单">
        <IconList />
        <span>清单</span>
      </button>
      <button type="button" className="dock-btn" onClick={() => onAdd('markdown')} title="Markdown">
        <IconMarkdown />
        <span>Markdown</span>
      </button>
      <button type="button" className="dock-btn" onClick={() => onAdd('group')} title="分组">
        <IconGroup />
        <span>分组</span>
      </button>
    </>
  )

  const opsItems = renderOpsItems(true)
  const opsItemsMeasure = renderOpsItems(false)

  const overflowBtn = (
    key: Exclude<DockMenu, null>,
    label: string,
    active: boolean,
    icon: ReactNode,
    children: ReactNode,
  ) => (
    <div className="dock-menu-wrap" key={key}>
      <button
        type="button"
        className={`dock-btn dock-overflow-btn${openMenu === key || active ? ' active' : ''}`}
        onClick={() => setOpenMenu((m) => (m === key ? null : key))}
        title={label}
      >
        {icon}
        <span>{label}</span>
        <IconChevron />
      </button>
      {openMenu === key && (
        <div className="dock-dropdown" role="menu">
          {children}
        </div>
      )}
    </div>
  )

  return (
    <div
      className="bottom-dock"
      role="toolbar"
      aria-label="画布工具"
      onPointerDown={(e) => e.stopPropagation()}
      ref={dockRef}
    >
      {/* Hidden full-width measure row — drives compact mode */}
      <div className="bottom-dock-measure" ref={measureRef} aria-hidden inert>
        <div className="bottom-dock-inner bottom-dock-inner-measure">
          {pointerItems}
          <span className="dock-sep" />
          {createItems}
          <span className="dock-sep" />
          {opsItemsMeasure}
          <span className="dock-sep dock-sep-push" />
          <button type="button" className="dock-btn" tabIndex={-1}>
            <IconSettings />
            <span>设置</span>
          </button>
          <div className="dock-workspace-slot dock-workspace-measure">
            <button type="button" className="dock-btn" tabIndex={-1}>
              <span>工作区占位加长名</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`bottom-dock-inner${compact ? ' is-compact' : ''}`}>
        {!compact ? (
          <>
            {pointerItems}
            <span className="dock-sep" aria-hidden />
            {createItems}
            <span className="dock-sep" aria-hidden />
            {opsItems}
            <span className="dock-sep dock-sep-push" aria-hidden />
            <button
              type="button"
              className="dock-btn"
              onClick={onOpenSettings}
              title="设置"
            >
              <IconSettings />
              <span>设置</span>
            </button>
            <div className="dock-workspace-slot">{workspaceSlot}</div>
          </>
        ) : (
          <>
            {overflowBtn('pointer', '鼠标', toolMode === 'marquee', <IconPointerMenu />, (
              <div className="dock-dropdown-row">{pointerItems}</div>
            ))}
            {overflowBtn('create', '新建', false, <IconCreateMenu />, (
              <div className="dock-dropdown-row">{createItems}</div>
            ))}
            {overflowBtn('ops', '控件操作', hasSelection, <IconOpsMenu />, (
              <div className="dock-dropdown-row dock-dropdown-ops">{opsItems}</div>
            ))}
            <span className="dock-sep dock-sep-push" aria-hidden />
            <button
              type="button"
              className="dock-btn"
              onClick={onOpenSettings}
              title="设置"
            >
              <IconSettings />
              <span>设置</span>
            </button>
            <div className="dock-workspace-slot">{workspaceSlot}</div>
          </>
        )}
      </div>
    </div>
  )
}
