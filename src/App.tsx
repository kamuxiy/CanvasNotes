import { useCallback, useRef, useState } from 'react'
import { TitleBar } from './components/TitleBar'
import { BottomDock } from './components/BottomDock'
import { CanvasBoard, StatusBar } from './components/CanvasBoard'
import { useCanvasStore } from './hooks/useCanvasStore'
import { defaultViewport } from './store'
import type { NodeKind, SocketSide } from './types'

export default function App() {
  const store = useCanvasStore()
  const workspaceRef = useRef<HTMLDivElement>(null)
  const [pendingAddKind, setPendingAddKind] = useState<NodeKind | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [socketDialogRequest, setSocketDialogRequest] = useState<{
    nodeId: string
    side: SocketSide
  } | null>(null)

  const placeNearCenter = useCallback(
    (kind: NodeKind) => {
      const vp = store.state.viewport
      const rect = workspaceRef.current?.getBoundingClientRect()
      const w = rect?.width ?? window.innerWidth
      const h = rect?.height ?? window.innerHeight - 120
      const x = (-vp.x + w / 2) / vp.zoom - 120
      const y = (-vp.y + h / 2) / vp.zoom - 40
      store.addNode(kind, x, y)
    },
    [store],
  )

  const fitView = useCallback(() => {
    const nodes = store.state.nodes
    const rect = workspaceRef.current?.getBoundingClientRect()
    if (!nodes.length || !rect) {
      store.setViewport(defaultViewport())
      return
    }
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const n of nodes) {
      minX = Math.min(minX, n.x)
      minY = Math.min(minY, n.y)
      maxX = Math.max(maxX, n.x + n.width)
      maxY = Math.max(maxY, n.y + 180)
    }
    const pad = 80
    const contentW = Math.max(maxX - minX, 1)
    const contentH = Math.max(maxY - minY, 1)
    const zoom = Math.min(
      1.4,
      Math.max(0.4, Math.min((rect.width - pad * 2) / contentW, (rect.height - pad * 2) / contentH)),
    )
    const x = (rect.width - contentW * zoom) / 2 - minX * zoom
    const y = (rect.height - contentH * zoom) / 2 - minY * zoom
    store.setViewport({ x, y, zoom })
  }, [store])

  return (
    <div className="app-root">
      <div className="app-shell is-desktop">
        <TitleBar />
        <div
          className="workspace"
          ref={workspaceRef}
          data-zoom={store.state.viewport.zoom}
        >
          <CanvasBoard
            state={store.state}
            setViewport={store.setViewport}
            addNode={store.addNode}
            updateNodeData={store.updateNodeData}
            moveNode={store.moveNode}
            deleteNodes={store.deleteNodes}
            addSocket={store.addSocket}
            renameSocket={store.renameSocket}
            removeSocket={store.removeSocket}
            tryConnect={store.tryConnect}
            deleteConnection={store.deleteConnection}
            pendingAddKind={pendingAddKind}
            onConsumedAdd={() => setPendingAddKind(null)}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            socketDialogRequest={socketDialogRequest}
            onSocketDialogHandled={() => setSocketDialogRequest(null)}
          />
          <BottomDock
            selectedCount={selectedIds.length}
            singleSelected={selectedIds.length === 1}
            onAdd={(kind) => {
              placeNearCenter(kind)
              setPendingAddKind(null)
            }}
            onDelete={() => {
              if (!selectedIds.length) return
              store.deleteNodes(selectedIds)
              setSelectedIds([])
            }}
            onDuplicate={() => {
              if (!selectedIds.length) return
              store.duplicateNodes(selectedIds)
            }}
            onAddSocketLeft={() => {
              const id = selectedIds[0]
              if (!id) return
              setSocketDialogRequest({ nodeId: id, side: 'left' })
            }}
            onAddSocketRight={() => {
              const id = selectedIds[0]
              if (!id) return
              setSocketDialogRequest({ nodeId: id, side: 'right' })
            }}
            onFit={fitView}
            onSeed={() => {
              if (window.confirm('恢复示例画布？（将覆盖当前内容）')) {
                store.resetDemo()
                setSelectedIds([])
              }
            }}
            onClear={() => {
              if (window.confirm('清空画布上的所有节点与连线？')) {
                store.clearCanvas()
                setSelectedIds([])
              }
            }}
          />
        </div>
        <StatusBar
          nodeCount={store.state.nodes.length}
          connectionCount={store.state.connections.length}
          zoom={store.state.viewport.zoom}
        />
      </div>
    </div>
  )
}
