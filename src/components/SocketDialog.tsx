import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SocketKind, SocketSide } from '../types'
import { SOCKET_KIND_LABEL } from '../types'

type SocketDialogProps = {
  open: boolean
  defaultSide?: SocketSide
  onClose: () => void
  onSubmit: (payload: { name: string; kind: SocketKind; side: SocketSide }) => void
}

export function SocketDialog({
  open,
  defaultSide = 'right',
  onClose,
  onSubmit,
}: SocketDialogProps) {
  const titleId = useId()
  const [name, setName] = useState('新连接点')
  const [kind, setKind] = useState<SocketKind>('generic')
  const [side, setSide] = useState<SocketSide>(defaultSide)

  useEffect(() => {
    if (open) {
      setName('新连接点')
      setKind('generic')
      setSide(defaultSide)
    }
  }, [open, defaultSide])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 id={titleId}>新建连接点</h3>
        <label className="modal-field">
          名称
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="自定义名称"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const trimmed = name.trim() || '未命名'
                onSubmit({ name: trimmed, kind, side })
                onClose()
              }
            }}
          />
        </label>
        <label className="modal-field">
          连接点类型
          <select value={kind} onChange={(e) => setKind(e.target.value as SocketKind)}>
            {(Object.keys(SOCKET_KIND_LABEL) as SocketKind[]).map((k) => (
              <option key={k} value={k}>
                {SOCKET_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="modal-field">
          位置
          <select value={side} onChange={(e) => setSide(e.target.value as SocketSide)}>
            <option value="left">左侧（输入）</option>
            <option value="right">右侧（输出）</option>
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="tool-btn primary"
            onClick={() => {
              const trimmed = name.trim() || '未命名'
              onSubmit({ name: trimmed, kind, side })
              onClose()
            }}
          >
            添加
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
