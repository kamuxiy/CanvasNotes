export type SocketKind = 'generic' | 'event' | 'date' | 'info'
export type SocketSide = 'left' | 'right'
export type NodeKind = 'note' | 'date' | 'list' | 'markdown' | 'group'
export type ToolMode = 'select' | 'marquee'

export interface Socket {
  id: string
  name: string
  kind: SocketKind
  side: SocketSide
}

export interface NoteData {
  title: string
  body: string
}

export interface DateData {
  label: string
  startDate: string
  endDate: string
}

export interface ListData {
  title: string
  items: string[]
}

export interface MarkdownData {
  /** Synced from the first `#` heading in content when present */
  title: string
  content: string
}

export interface GroupData {
  title: string
  /** CSS color for translucent body */
  color: string
}

export type NodeData = NoteData | DateData | ListData | MarkdownData | GroupData

export interface FieldSize {
  /** User-adjusted field width; height is always content-auto. */
  width: number
}

export interface CanvasNode {
  id: string
  kind: NodeKind
  x: number
  y: number
  width: number
  height: number
  sockets: Socket[]
  data: NodeData
  /** Persisted native textarea resize sizes, keyed by field id */
  fieldSizes?: Record<string, FieldSize>
}

export interface Connection {
  id: string
  fromNodeId: string
  fromSocketId: string
  toNodeId: string
  toSocketId: string
}

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface AppState {
  nodes: CanvasNode[]
  connections: Connection[]
  viewport: Viewport
}

export interface WorkspaceMeta {
  id: string
  name: string
  updatedAt: number
}

export interface WorkspaceDocument {
  version: 1
  id: string
  name: string
  updatedAt: number
  state: AppState
}

export const SOCKET_KIND_LABEL: Record<SocketKind, string> = {
  generic: '通用',
  event: '相关事件',
  date: '日期',
  info: '相关信息',
}

export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  note: '便签 / 记事本',
  date: '开始 / 截止日期',
  list: '信息列表',
  markdown: 'Markdown',
  group: '分组',
}

/** Figma default palette accents for sockets / node borders */
export const SOCKET_COLORS: Record<SocketKind, string> = {
  generic: '#ff7262',
  event: '#ffa629',
  date: '#0d99ff',
  info: '#14ae5c',
}

/** Markdown / custom node accent (Figma purple) */
export const MARKDOWN_ACCENT = '#9747ff'

/** Upload Labs–inspired group color presets (Figma palette) */
export const GROUP_COLOR_PRESETS = [
  'rgba(13, 153, 255, 0.20)',
  'rgba(255, 114, 98, 0.18)',
  'rgba(255, 166, 41, 0.20)',
  'rgba(20, 174, 92, 0.18)',
  'rgba(151, 71, 255, 0.20)',
  'rgba(244, 114, 182, 0.18)',
  'rgba(250, 204, 21, 0.18)',
  'rgba(148, 163, 184, 0.22)',
] as const
