import type { NodeKind } from '../types'

type Props = {
  selectedCount: number
  singleSelected: boolean
  onAdd: (kind: NodeKind) => void
  onDelete: () => void
  onDuplicate: () => void
  onAddSocketLeft: () => void
  onAddSocketRight: () => void
  onFit: () => void
  onSeed: () => void
  onClear: () => void
}

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

export function BottomDock({
  selectedCount,
  singleSelected,
  onAdd,
  onDelete,
  onDuplicate,
  onAddSocketLeft,
  onAddSocketRight,
  onFit,
  onSeed,
  onClear,
}: Props) {
  const hasSelection = selectedCount > 0

  return (
    <div
      className="bottom-dock"
      role="toolbar"
      aria-label="画布工具"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bottom-dock-inner">
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

        <span className="dock-sep" aria-hidden />

        <button type="button" className="dock-btn" onClick={onFit} title="适应画布">
          <IconFit />
          <span>适应</span>
        </button>
        <button type="button" className="dock-btn dock-btn-ghost" onClick={onSeed} title="载入示例">
          <span>示例</span>
        </button>
        <button type="button" className="dock-btn dock-btn-ghost" onClick={onClear} title="清空画布">
          <span>清空</span>
        </button>

        {hasSelection && (
          <>
            <span className="dock-sep" aria-hidden />
            <button
              type="button"
              className="dock-btn dock-btn-danger"
              onClick={onDelete}
              title="删除选中"
            >
              <IconTrash />
              <span>删除</span>
            </button>
            <button type="button" className="dock-btn" onClick={onDuplicate} title="复制选中">
              <IconCopy />
              <span>复制</span>
            </button>
            {singleSelected && (
              <>
                <button
                  type="button"
                  className="dock-btn"
                  onClick={onAddSocketLeft}
                  title="左侧添加连接点"
                >
                  <IconPlus />
                  <span>+左</span>
                </button>
                <button
                  type="button"
                  className="dock-btn"
                  onClick={onAddSocketRight}
                  title="右侧添加连接点"
                >
                  <IconPlus />
                  <span>+右</span>
                </button>
              </>
            )}
            <span className="dock-selection-hint">{selectedCount} 项</span>
          </>
        )}
      </div>
    </div>
  )
}
