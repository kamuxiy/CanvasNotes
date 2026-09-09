import { useEffect, useReducer, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import {
  addSocket as addSocketToNode,
  createConnection,
  createDemoState,
  createNode,
  loadState,
  normalizeConnectionEndpoints,
  saveState,
} from '../store'
import type {
  AppState,
  CanvasNode,
  NodeKind,
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
  | { type: 'delete-nodes'; ids: string[] }
  | { type: 'duplicate-nodes'; ids: string[] }
  | { type: 'add-socket'; nodeId: string; side: SocketSide; kind: SocketKind; name: string }
  | { type: 'rename-socket'; nodeId: string; socketId: string; name: string }
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
      if (selected.length === 0) return state
      const offset = 36
      const clones: CanvasNode[] = selected.map((node) => ({
        ...node,
        id: uuid(),
        x: node.x + offset,
        y: node.y + offset,
        sockets: node.sockets.map((s) => ({ ...s, id: uuid() })),
        data: structuredClone(node.data),
      }))
      return {
        ...state,
        nodes: [...state.nodes, ...clones],
      }
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
    case 'rename-socket':
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.nodeId
            ? {
                ...n,
                sockets: n.sockets.map((s) =>
                  s.id === action.socketId ? { ...s, name: action.name } : s,
                ),
              }
            : n,
        ),
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
    addNode: (kind: NodeKind, x: number, y: number) =>
      dispatch({ type: 'add-node', kind, x, y }),
    updateNode: (id: string, patch: Partial<CanvasNode>) =>
      dispatch({ type: 'update-node', id, patch }),
    updateNodeData: (id: string, data: CanvasNode['data']) =>
      dispatch({ type: 'update-node-data', id, data }),
    moveNode: (id: string, x: number, y: number) =>
      dispatch({ type: 'move-node', id, x, y }),
    deleteNodes: (ids: string[]) => dispatch({ type: 'delete-nodes', ids }),
    duplicateNodes: (ids: string[]) => dispatch({ type: 'duplicate-nodes', ids }),
    addSocket: (nodeId: string, side: SocketSide, kind: SocketKind, name: string) =>
      dispatch({ type: 'add-socket', nodeId, side, kind, name }),
    renameSocket: (nodeId: string, socketId: string, name: string) =>
      dispatch({ type: 'rename-socket', nodeId, socketId, name }),
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
  }
}
