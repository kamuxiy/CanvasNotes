import { v4 as uuid } from 'uuid'
import type {
  AppState,
  CanvasNode,
  Connection,
  DateData,
  ListData,
  NodeData,
  NodeKind,
  NoteData,
  Socket,
  SocketKind,
  SocketSide,
  Viewport,
} from './types'

const STORAGE_KEY = 'canvas-notes-v2'

export function createDefaultSockets(_kind: NodeKind): Socket[] {
  return [
    { id: uuid(), name: '输入', kind: 'generic', side: 'left' },
    { id: uuid(), name: '输出', kind: 'generic', side: 'right' },
  ]
}

export function createNodeData(kind: NodeKind): NodeData {
  switch (kind) {
    case 'note':
      return { title: '新便签', body: '' } satisfies NoteData
    case 'date':
      return {
        label: '日程节点',
        startDate: '',
        endDate: '',
      } satisfies DateData
    case 'list':
      return { title: '信息列表', items: [''] } satisfies ListData
  }
}

export function createNode(kind: NodeKind, x: number, y: number): CanvasNode {
  return {
    id: uuid(),
    kind,
    x,
    y,
    width: kind === 'list' ? 260 : 240,
    sockets: createDefaultSockets(kind),
    data: createNodeData(kind),
  }
}

export function createConnection(
  fromNodeId: string,
  fromSocketId: string,
  toNodeId: string,
  toSocketId: string,
): Connection {
  return {
    id: uuid(),
    fromNodeId,
    fromSocketId,
    toNodeId,
    toSocketId,
  }
}

export function defaultViewport(): Viewport {
  return { x: 80, y: 60, zoom: 1 }
}

export function createDemoState(): AppState {
  const noteA = createNode('note', 120, 140)
  noteA.data = {
    title: '产品启动会',
    body: '明确本周交付范围，整理阻塞项与负责人。',
  }

  const dateA = createNode('date', 460, 120)
  dateA.data = {
    label: '本周里程碑',
    startDate: '2026-09-08',
    endDate: '2026-09-12',
  }

  const listA = createNode('list', 800, 160)
  listA.data = {
    title: '待确认事项',
    items: ['设计稿走查', '接口字段对齐', '测试环境账号'],
  }

  const noteB = createNode('note', 120, 420)
  noteB.data = {
    title: '风险备忘',
    body: '第三方 SDK 文档滞后，需要备用方案。',
  }

  const noteAOut = noteA.sockets.find((s) => s.side === 'right')!
  const noteBIn = noteB.sockets.find((s) => s.side === 'left')!
  const dateOut = dateA.sockets.find((s) => s.side === 'right')!
  const listIn = listA.sockets.find((s) => s.side === 'left')!

  // Extra typed sockets for demo variety
  const noteDateOut: Socket = {
    id: uuid(),
    name: '截止提醒',
    kind: 'date',
    side: 'right',
  }
  const dateFromNote: Socket = {
    id: uuid(),
    name: '关联便签',
    kind: 'date',
    side: 'left',
  }
  noteA.sockets.push(noteDateOut)
  dateA.sockets.push(dateFromNote)

  return {
    nodes: [noteA, dateA, listA, noteB],
    connections: [
      createConnection(noteA.id, noteAOut.id, noteB.id, noteBIn.id),
      createConnection(noteA.id, noteDateOut.id, dateA.id, dateFromNote.id),
      createConnection(dateA.id, dateOut.id, listA.id, listIn.id),
    ],
    viewport: defaultViewport(),
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDemoState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.nodes || !parsed.connections || !parsed.viewport) {
      return createDemoState()
    }
    return parsed
  } catch {
    return createDemoState()
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function findSocket(
  nodes: CanvasNode[],
  nodeId: string,
  socketId: string,
): Socket | undefined {
  return nodes.find((n) => n.id === nodeId)?.sockets.find((s) => s.id === socketId)
}

export function kindsCompatible(a: SocketKind, b: SocketKind): boolean {
  if (a === 'generic' || b === 'generic') return true
  return a === b
}

export function canConnect(
  nodes: CanvasNode[],
  fromNodeId: string,
  fromSocketId: string,
  toNodeId: string,
  toSocketId: string,
): boolean {
  // No self-links; only opposite sides (left ↔ right) on different cards
  if (fromNodeId === toNodeId) return false
  const from = findSocket(nodes, fromNodeId, fromSocketId)
  const to = findSocket(nodes, toNodeId, toSocketId)
  if (!from || !to) return false
  if (from.side === to.side) return false
  if (!kindsCompatible(from.kind, to.kind)) return false
  const out = from.side === 'right' ? from : to
  const inn = from.side === 'left' ? from : to
  if (out.side !== 'right' || inn.side !== 'left') return false
  return true
}

export function normalizeConnectionEndpoints(
  nodes: CanvasNode[],
  aNodeId: string,
  aSocketId: string,
  bNodeId: string,
  bSocketId: string,
): { fromNodeId: string; fromSocketId: string; toNodeId: string; toSocketId: string } | null {
  const a = findSocket(nodes, aNodeId, aSocketId)
  const b = findSocket(nodes, bNodeId, bSocketId)
  if (!a || !b) return null
  if (!canConnect(nodes, aNodeId, aSocketId, bNodeId, bSocketId)) return null
  if (a.side === 'right') {
    return {
      fromNodeId: aNodeId,
      fromSocketId: aSocketId,
      toNodeId: bNodeId,
      toSocketId: bSocketId,
    }
  }
  return {
    fromNodeId: bNodeId,
    fromSocketId: bSocketId,
    toNodeId: aNodeId,
    toSocketId: aSocketId,
  }
}

export function addSocket(
  node: CanvasNode,
  side: SocketSide,
  kind: SocketKind,
  name: string,
): CanvasNode {
  return {
    ...node,
    sockets: [...node.sockets, { id: uuid(), name, kind, side }],
  }
}
