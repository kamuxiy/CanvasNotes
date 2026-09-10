import { useEffect, useReducer, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import {
  addSocket as addSocketToNode,
  createConnection,
  createDemoState,
  createNode,
  loadState,
  membersOfGroup,
  normalizeConnectionEndpoints,
  saveState,
} from '../store'
import type {
  AppState,
  CanvasNode,
  GroupData,
  NodeKind,
  Socket,
  SocketKind,
  SocketSide,
  Viewport,
} from '../types'

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'set-viewport'; viewport: Viewport }
  | { type: 'add-node'; kind: NodeKind; x: number; y: number }
  | { type: 'update-node'; id: string; patch: Partial<CanvasNode> }
  | { type: 'update-node-data'; id: string; data: CanvasNode['data'] }
  | { type: 'move-node'; id: string; x: number; y: number }
  | { type: 'move-nodes'; moves: { id: string; x: number; y: number }[] }
  | { type: 'resize-node'; id: string; x: number; y: number; width: number; height: number }
  | { type: 'delete-nodes'; ids: string[] }
  | { type: 'duplicate-nodes'; ids: string[] }
  | { type: 'add-socket'; nodeId: string; side: SocketSide; kind: SocketKind; name: string }
  | { type: 'update-socket'; nodeId: string; socketId: string; patch: Partial<Socket> }
  | { type: 'reorder-sockets'; nodeId: string; socketIds: string[] }
  | { type: 'remove-socket'; nodeId: string; socketId: string }
  | {
      type: 'try-connect'
      aNodeId: string
      aSocketId: string
      bNodeId: string
      bSocketId: string
    }
  | { type: 'delete-connection'; id: string }
  | { type: 'clear-canvas' }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state
    case 'set-viewport':
      return { ...state, viewport: action.viewport }
    case 'add-node':
      return {
        ...state,
        nodes: [...state.nodes, createNode(action.kind, action.x, action.y)],
      }
    case 'update-node':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, ...action.patch, id: n.id } : n,
        ),
      }
    case 'update-node-data':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, data: action.data } : n,
        ),
      }
    case 'move-node':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, x: action.x, y: action.y } : n,
        ),
      }
    case 'move-nodes': {
      const map = new Map(action.moves.map((m) => [m.id, m]))
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          const m = map.get(n.id)
          return m ? { ...n, x: m.x, y: m.y } : n
        }),
      }
    }
    case 'resize-node':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id
            ? {
                ...n,
                x: action.x,
                y: action.y,
                width: Math.max(160, action.width),
                height: Math.max(100, action.height),
              }
            : n,
        ),
      }
    case 'delete-nodes': {
      const ids = new Set(action.ids)
      return {
        ...state,
        nodes: state.nodes.filter((n) => !ids.has(n.id)),
        connections: state.connections.filter(
          (c) => !ids.has(c.fromNodeId) && !ids.has(c.toNodeId),
        ),
      }
    }
    case 'duplicate-nodes': {
      const idSet = new Set(action.ids)
      const selected = state.nodes.filter((n) => idSet.has(n.id))
      if (!selected.length) return state
      const clones: CanvasNode[] = selected.map((node) => ({
        ...node,
        id: uuid(),
        x: node.x + 36,
        y: node.y + 36,
        sockets: node.sockets.map((s) => ({ ...s, id: uuid() })),
        data: structuredClone(node.data),
      }))
      return { ...state, nodes: [...state.nodes, ...clones] }
    }
    case 'add-socket':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId
            ? addSocketToNode(n, action.side, action.kind, action.name)
            : n,
        ),
      }
    case 'update-socket':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId
            ? {
                ...n,
                sockets: n.sockets.map((s) =>
                  s.id === action.socketId ? { ...s, ...action.patch, id: s.id } : s,
                ),
              }
            : n,
        ),
      }
    case 'reorder-sockets':
      return {
        ...state,
        nodes: state.nodes.map((n) => {
          if (n.id !== action.nodeId) return n
          const byId = new Map(n.sockets.map((s) => [s.id, s]))
          const next = action.socketIds
            .map((id) => byId.get(id))
            .filter(Boolean) as Socket[]
          for (const s of n.sockets) {
            if (!action.socketIds.includes(s.id)) next.push(s)
          }
          return { ...n, sockets: next }
        }),
      }
    case 'remove-socket':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId
            ? { ...n, sockets: n.sockets.filter((s) => s.id !== action.socketId) }
            : n,
        ),
        connections: state.connections.filter(
          (c) =>
            !(
              (c.fromNodeId === action.nodeId && c.fromSocketId === action.socketId) ||
              (c.toNodeId === action.nodeId && c.toSocketId === action.socketId)
            ),
        ),
      }
    case 'try-connect': {
      const ends = normalizeConnectionEndpoints(
        state.nodes,
        action.aNodeId,
        action.aSocketId,
        action.bNodeId,
        action.bSocketId,
      )
      if (!ends) return state
      const exists = state.connections.some(
        (c) =>
          c.fromNodeId === ends.fromNodeId &&
          c.fromSocketId === ends.fromSocketId &&
          c.toNodeId === ends.toNodeId &&
          c.toSocketId === ends.toSocketId,
      )
      if (exists) return state
      return {
        ...state,
        connections: [
          ...state.connections,
          createConnection(
            ends.fromNodeId,
            ends.fromSocketId,
            ends.toNodeId,
            ends.toSocketId,
          ),
        ],
      }
    }
    case 'delete-connection':
      return {
        ...state,
        connections: state.connections.filter((c) => c.id !== action.id),
      }
    case 'clear-canvas':
      return { ...state, nodes: [], connections: [] }
    default:
      return state
  }
}

export function useCanvasStore() {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  const ready = useRef(false)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    ready.current = true
  }, [])

  useEffect(() => {
    if (!ready.current) return
    saveState(state)
  }, [state])

  return {
    state,
    setViewport: (viewport: Viewport) => dispatch({ type: 'set-viewport', viewport }),
    hydrate: (next: AppState) => dispatch({ type: 'hydrate', state: next }),
    addNode: (kind: NodeKind, x: number, y: number) =>
      dispatch({ type: 'add-node', kind, x, y }),
    updateNode: (id: string, patch: Partial<CanvasNode>) =>
      dispatch({ type: 'update-node', id, patch }),
    updateNodeData: (id: string, data: CanvasNode['data']) =>
      dispatch({ type: 'update-node-data', id, data }),
    moveNode: (id: string, x: number, y: number) =>
      dispatch({ type: 'move-node', id, x, y }),
    moveNodes: (moves: { id: string; x: number; y: number }[]) =>
      dispatch({ type: 'move-nodes', moves }),
    resizeNode: (id: string, x: number, y: number, width: number, height: number) =>
      dispatch({ type: 'resize-node', id, x, y, width, height }),
    deleteNodes: (ids: string[]) => dispatch({ type: 'delete-nodes', ids }),
    duplicateNodes: (ids: string[]) => dispatch({ type: 'duplicate-nodes', ids }),
    addSocket: (nodeId: string, side: SocketSide, kind: SocketKind, name: string) =>
      dispatch({ type: 'add-socket', nodeId, side, kind, name }),
    updateSocket: (nodeId: string, socketId: string, patch: Partial<Socket>) =>
      dispatch({ type: 'update-socket', nodeId, socketId, patch }),
    reorderSockets: (nodeId: string, socketIds: string[]) =>
      dispatch({ type: 'reorder-sockets', nodeId, socketIds }),
    renameSocket: (nodeId: string, socketId: string, name: string) =>
      dispatch({ type: 'update-socket', nodeId, socketId, patch: { name } }),
    removeSocket: (nodeId: string, socketId: string) =>
      dispatch({ type: 'remove-socket', nodeId, socketId }),
    tryConnect: (
      aNodeId: string,
      aSocketId: string,
      bNodeId: string,
      bSocketId: string,
    ) => dispatch({ type: 'try-connect', aNodeId, aSocketId, bNodeId, bSocketId }),
    deleteConnection: (id: string) => dispatch({ type: 'delete-connection', id }),
    clearCanvas: () => dispatch({ type: 'clear-canvas' }),
    resetDemo: () => dispatch({ type: 'hydrate', state: createDemoState() }),
    setGroupColor: (id: string, color: string) => {
      const node = stateRef.current.nodes.find((n) => n.id === id)
      if (!node || node.kind !== 'group') return
      const data = node.data as GroupData
      dispatch({ type: 'update-node-data', id, data: { ...data, color } })
    },
    moveGroupWithMembers: (
      groupId: string,
      x: number,
      y: number,
      memberIds?: string[],
    ) => {
      const group = stateRef.current.nodes.find((n) => n.id === groupId)
      if (!group || group.kind !== 'group') {
        dispatch({ type: 'move-node', id: groupId, x, y })
        return
      }
      const dx = x - group.x
      const dy = y - group.y
      // Use drag-start membership only — nodes entering mid-drag must not follow.
      const lockedIds =
        memberIds ??
        membersOfGroup(group, stateRef.current.nodes).map((m) => m.id)
      const idSet = new Set(lockedIds)
      const members = stateRef.current.nodes.filter((n) => idSet.has(n.id))
      dispatch({
        type: 'move-nodes',
        moves: [
          { id: groupId, x, y },
          ...members.map((m) => ({ id: m.id, x: m.x + dx, y: m.y + dy })),
        ],
      })
    },
  }
}
