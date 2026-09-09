import type { CSSProperties, MouseEvent, PointerEvent } from 'react'
import type { Socket, SocketKind } from '../types'
import { SOCKET_COLORS } from '../types'

type SocketPortProps = {
  socket: Socket
  active?: boolean
  compatible?: boolean
  onPointerDown: (e: PointerEvent, socket: Socket) => void
  onPointerEnter: (socket: Socket) => void
  onPointerLeave: () => void
  onDoubleClick: (socket: Socket) => void
  onContextMenu?: (e: MouseEvent, socket: Socket) => void
}

export function SocketPort({
  socket,
  active,
  compatible,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  onDoubleClick,
  onContextMenu,
}: SocketPortProps) {
  const color = SOCKET_COLORS[socket.kind as SocketKind]
  const style: CSSProperties = {
    color,
    opacity: compatible === false ? 0.35 : 1,
  }

  return (
    <div
      className={`socket-row ${socket.side}${active ? ' active' : ''}`}
      style={style}
      title={`${socket.name}（双击重命名 / 右键删除）`}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onContextMenu?.(e, socket)
      }}
    >
      <button
        type="button"
        className="socket-dot"
        data-socket-id={socket.id}
        aria-label={socket.name}
        onPointerDown={(e) => {
          e.stopPropagation()
          onPointerDown(e, socket)
        }}
        onPointerEnter={() => onPointerEnter(socket)}
        onPointerLeave={onSocketLeaveSafe(onPointerLeave)}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onDoubleClick(socket)
        }}
      />
      <span
        className="socket-label"
        data-socket-side={socket.side}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onDoubleClick(socket)
        }}
      >
        {socket.name}
      </span>
    </div>
  )
}

function onSocketLeaveSafe(fn: () => void) {
  return () => fn()
}
