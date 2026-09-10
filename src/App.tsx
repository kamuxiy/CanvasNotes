import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { TitleBar } from './components/TitleBar'
import { BottomDock } from './components/BottomDock'
import { CanvasBoard, StatusBar } from './components/CanvasBoard'
import { SocketManagerPanel } from './components/SocketManagerPanel'
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher'
import { SettingsModal } from './components/SettingsModal'
import { useCanvasStore } from './hooks/useCanvasStore'
import {
  createWorkspace,
  defaultViewport,
  getActiveWorkspaceId,
  loadWorkspaceDoc,
} from './store'
import type { GroupData, NodeKind, SocketSide, ToolMode } from './types'

export default function App() {
  const store = useCanvasStore()
  const workspaceRef = useRef<HTMLDivElement>(null)
  const bootstrapped = useRef(false)
  const [toolMode, setToolMode] = useState<ToolMode>('select')
  const [pendingAddKind, setPendingAddKind] = useState<NodeKind | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [handleNodeId, setHandleNodeId] = useState<string | null>(null)
  const [socketManagerOpen, setSocketManagerOpen] = useState(false)
  const [socketDialogRequest, setSocketDialogRequest] = useState<{
    nodeId: string
    side: SocketSide
  } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true
    const activeId = getActiveWorkspaceId()
    if (activeId) {
      const doc = loadWorkspaceDoc(activeId)
      if (doc) {
        store.hydrate(doc.state)
        return
      }
    }
    if (!getActiveWorkspaceId()) {
      createWorkspace('默认工作区', store.state)
    }
  }, [store])

  const selectedNodes = useMemo(
    () => store.state.nodes.filter((n) => selectedIds.includes(n.id)),
    [store.state.nodes, selectedIds],
  )

  const singleSelectedNode =
    selectedNodes.length === 1 ? selectedNodes[0] : null
  const singleGroupSelected = singleSelectedNode?.kind === 'group'
  const singleNonGroupSelected =
    singleSelectedNode != null && singleSelectedNode.kind !== 'group'

  const groupColor =
    singleGroupSelected && singleSelectedNode
      ? (singleSelectedNode.data as GroupData).color
      : undefined

  const placeNearCenter = useCallback(
    (kind: NodeKind) => {
      const vp = store.state.viewport
      const rect = workspaceRef.current?.getBoundingClientRect()
      const w = rect?.width ?? window.innerWidth
      const h = rect?.height ?? window.innerHeight - 120
      const x = (-vp.x + w / 2) / vp.zoom - (kind === 'group' ? 180 : 120)
      const y = (-vp.y + h / 2) / vp.zoom - (kind === 'group' ? 120 : 40)
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
      maxY = Math.max(maxY, n.y + (n.kind === 'group' ? n.height : 180))
    }
    const pad = 80
    const contentW = Math.max(maxX - minX, 1)
    const contentH = Math.max(maxY - minY, 1)
    const zoom = Math.min(
      1.4,
      Math.max(
        0.4,
        Math.min(
          (rect.width - pad * 2) / contentW,
          (rect.height - pad * 2) / contentH,
        ),
      ),
    )
    const x = (rect.width - contentW * zoom) / 2 - minX * zoom
    const y = (rect.height - contentH * zoom) / 2 - minY * zoom
    store.setViewport({ x, y, zoom })
  }, [store])

  const socketManagerNode =
    socketManagerOpen && singleNonGroupSelected && singleSelectedNode
      ? singleSelectedNode
      : null

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
            toolMode={toolMode}
            onToolModeChange={setToolMode}
            setViewport={store.setViewport}
            addNode={store.addNode}
            updateNode={store.updateNode}
            updateNodeData={store.updateNodeData}
            moveNode={store.moveNode}
            moveNodes={store.moveNodes}
            moveGroupWithMembers={store.moveGroupWithMembers}
            resizeNode={store.resizeNode}
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
            handleNodeId={handleNodeId}
            onHandleNodeIdChange={setHandleNodeId}
            onClearHandles={() => setHandleNodeId(null)}
            socketDialogRequest={socketDialogRequest}
            onSocketDialogHandled={() => setSocketDialogRequest(null)}
          />
          <BottomDock
            toolMode={toolMode}
            onToolModeChange={setToolMode}
            onAdd={(kind) => {
              placeNearCenter(kind)
              setPendingAddKind(null)
            }}
            selectedCount={selectedIds.length}
            singleSelected={selectedIds.length === 1}
            singleGroupSelected={singleGroupSelected}
            singleNonGroupSelected={singleNonGroupSelected}
            onDelete={() => {
              if (!selectedIds.length) return
              store.deleteNodes(selectedIds)
              setSelectedIds([])
              setHandleNodeId(null)
              setSocketManagerOpen(false)
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
            onOpenSocketManager={() => setSocketManagerOpen(true)}
            groupColor={groupColor}
            groupTitle={
              singleGroupSelected && singleSelectedNode
                ? (singleSelectedNode.data as GroupData).title
                : undefined
            }
            onGroupTitle={
              singleGroupSelected && singleSelectedNode
                ? (title) =>
                    store.updateNodeData(singleSelectedNode.id, {
                      ...(singleSelectedNode.data as GroupData),
                      title,
                    })
                : undefined
            }
            onGroupColor={
              singleGroupSelected && singleSelectedNode
                ? (color) => store.setGroupColor(singleSelectedNode.id, color)
                : undefined
            }
            workspaceSlot={
              <WorkspaceSwitcher
                currentState={store.state}
                onLoadState={(state) => {
                  store.hydrate(state)
                  setSelectedIds([])
                  setHandleNodeId(null)
                  setSocketManagerOpen(false)
                }}
              />
            }
            onFit={fitView}
            onSeed={() => {
              if (window.confirm('恢复示例画布？（将覆盖当前内容）')) {
                store.resetDemo()
                setSelectedIds([])
                setHandleNodeId(null)
                setSocketManagerOpen(false)
              }
            }}
            onOpenSettings={() => setSettingsOpen(true)}
            onClear={() => {
              if (window.confirm('清空画布上的所有节点与连线？')) {
                store.clearCanvas()
                setSelectedIds([])
                setHandleNodeId(null)
                setSocketManagerOpen(false)
              }
            }}
          />

          {socketManagerNode && (
            <SocketManagerPanel
              node={socketManagerNode}
              onClose={() => setSocketManagerOpen(false)}
              onUpdateSocket={(socketId, patch) =>
                store.updateSocket(socketManagerNode.id, socketId, patch)
              }
              onReorder={(socketIds) =>
                store.reorderSockets(socketManagerNode.id, socketIds)
              }
              onRemove={(socketId) =>
                store.removeSocket(socketManagerNode.id, socketId)
              }
              onAdd={(side, kind, name) =>
                store.addSocket(socketManagerNode.id, side, kind, name)
              }
            />
          )}
          <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
