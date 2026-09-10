import { v4 as uuid } from 'uuid'
import type {
  AppState,
  CanvasNode,
  Connection,
  DateData,
  GroupData,
  ListData,
  NodeData,
  NodeKind,
  NoteData,
  Socket,
  SocketKind,
  SocketSide,
  Viewport,
  WorkspaceDocument,
  WorkspaceMeta,
} from './types'

const STORAGE_KEY = 'canvas-notes-v3'
const WS_INDEX_KEY = 'canvas-notes-ws-index'
const WS_ACTIVE_KEY = 'canvas-notes-ws-active'
const WS_DOC_PREFIX = 'canvas-notes-ws-doc:'
const RECENT_KEY = 'canvas-notes-ws-recent'

export function createDefaultSockets(kind: NodeKind): Socket[] {
  if (kind === 'group') return []
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
    case 'group':
      return {
        title: '分组',
        color: 'rgba(62, 199, 255, 0.20)',
      } satisfies GroupData
  }
}

export function createNode(kind: NodeKind, x: number, y: number): CanvasNode {
  const isGroup = kind === 'group'
  return {
    id: uuid(),
    kind,
    x,
    y,
    width: isGroup ? 360 : kind === 'list' ? 260 : 240,
    height: isGroup ? 240 : 160,
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

  const group = createNode('group', 400, 360)
  group.width = 420
  group.height = 280
  group.data = { title: '本周范围', color: 'rgba(62, 199, 255, 0.16)' }

  const noteAOut = noteA.sockets.find((s) => s.side === 'right')!
  const noteBIn = noteB.sockets.find((s) => s.side === 'left')!
  const dateOut = dateA.sockets.find((s) => s.side === 'right')!
  const listIn = listA.sockets.find((s) => s.side === 'left')!

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
    nodes: [group, noteA, dateA, listA, noteB],
    connections: [
      createConnection(noteA.id, noteAOut.id, noteB.id, noteBIn.id),
      createConnection(noteA.id, noteDateOut.id, dateA.id, dateFromNote.id),
      createConnection(dateA.id, dateOut.id, listA.id, listIn.id),
    ],
    viewport: defaultViewport(),
  }
}

function migrateNode(raw: CanvasNode): CanvasNode {
  return {
    ...raw,
    height: raw.height ?? (raw.kind === 'group' ? 240 : 160),
    sockets: raw.sockets ?? [],
    data: raw.data,
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
    return {
      ...parsed,
      nodes: parsed.nodes.map(migrateNode),
    }
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

export function nodeBounds(node: CanvasNode) {
  return {
    left: node.x,
    top: node.y,
    right: node.x + node.width,
    bottom: node.y + node.height,
    cx: node.x + node.width / 2,
    cy: node.y + node.height / 2,
  }
}

export function rectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
}

/** Non-group nodes whose center lies inside the group frame */
export function membersOfGroup(group: CanvasNode, nodes: CanvasNode[]): CanvasNode[] {
  if (group.kind !== 'group') return []
  const g = nodeBounds(group)
  return nodes.filter((n) => {
    if (n.id === group.id || n.kind === 'group') return false
    const b = nodeBounds(n)
    return b.cx >= g.left && b.cx <= g.right && b.cy >= g.top && b.cy <= g.bottom
  })
}

// —— Workspace persistence ——

export function listWorkspaceIndex(): WorkspaceMeta[] {
  try {
    const raw = localStorage.getItem(WS_INDEX_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WorkspaceMeta[]
  } catch {
    return []
  }
}

function saveWorkspaceIndex(list: WorkspaceMeta[]) {
  localStorage.setItem(WS_INDEX_KEY, JSON.stringify(list))
}

export function getActiveWorkspaceId(): string | null {
  return localStorage.getItem(WS_ACTIVE_KEY)
}

export function setActiveWorkspaceId(id: string | null) {
  if (id) localStorage.setItem(WS_ACTIVE_KEY, id)
  else localStorage.removeItem(WS_ACTIVE_KEY)
}

export function loadWorkspaceDoc(id: string): WorkspaceDocument | null {
  try {
    const raw = localStorage.getItem(WS_DOC_PREFIX + id)
    if (!raw) return null
    const doc = JSON.parse(raw) as WorkspaceDocument
    doc.state = {
      ...doc.state,
      nodes: doc.state.nodes.map(migrateNode),
    }
    return doc
  } catch {
    return null
  }
}

export function saveWorkspaceDoc(doc: WorkspaceDocument) {
  localStorage.setItem(WS_DOC_PREFIX + doc.id, JSON.stringify(doc))
  const index = listWorkspaceIndex().filter((w) => w.id !== doc.id)
  index.unshift({ id: doc.id, name: doc.name, updatedAt: doc.updatedAt })
  saveWorkspaceIndex(index)
  pushRecent(doc.id)
}

export function deleteWorkspaceDoc(id: string) {
  localStorage.removeItem(WS_DOC_PREFIX + id)
  saveWorkspaceIndex(listWorkspaceIndex().filter((w) => w.id !== id))
  const recent = listRecent().filter((r) => r !== id)
  if (getActiveWorkspaceId() === id) setActiveWorkspaceId(null)
}

export function createWorkspace(name: string, state?: AppState): WorkspaceDocument {
  const doc: WorkspaceDocument = {
    version: 1,
    id: uuid(),
    name,
    updatedAt: Date.now(),
    state: state ?? { nodes: [], connections: [], viewport: defaultViewport() },
  }
  saveWorkspaceDoc(doc)
  setActiveWorkspaceId(doc.id)
  return doc
}

export function listRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

function pushRecent(id: string) {
  const next = [id, ...listRecent().filter((x) => x !== id)].slice(0, 8)
  localStorage.setItem(RECENT_KEY, JSON.stringify(next))
}

export function exportWorkspaceJson(doc: WorkspaceDocument): string {
  return JSON.stringify(doc, null, 2)
}

export function parseWorkspaceJson(text: string): WorkspaceDocument | null {
  try {
    const doc = JSON.parse(text) as WorkspaceDocument
    if (!doc.state?.nodes || !doc.state?.connections || !doc.state?.viewport) return null
    return {
      version: 1,
      id: doc.id || uuid(),
      name: doc.name || '导入的工作区',
      updatedAt: Date.now(),
      state: {
        ...doc.state,
        nodes: doc.state.nodes.map(migrateNode),
      },
    }
  } catch {
    return null
  }
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
