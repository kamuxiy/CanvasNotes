export type SocketKind = 'generic' | 'event' | 'date' | 'info'
export type SocketSide = 'left' | 'right'
export type NodeKind = 'note' | 'date' | 'list' | 'group'
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

export interface GroupData {
  title: string
  /** CSS color for translucent body */
  color: string
}

export type NodeData = NoteData | DateData | ListData | GroupData

export interface CanvasNode {
  id: string
  kind: NodeKind
  x: number
  y: number
  width: number
  height: number
  sockets: Socket[]
  data: NodeData
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
  group: '分组',
}

export const SOCKET_COLORS: Record<SocketKind, string> = {
  generic: '#ff4d5e',
  event: '#ff9a3c',
  date: '#3ec7ff',
  info: '#4ade80',
}

/** Upload Labs–inspired group color presets */
export const GROUP_COLOR_PRESETS = [
  'rgba(62, 199, 255, 0.20)',
  'rgba(255, 77, 94, 0.18)',
  'rgba(255, 154, 60, 0.20)',
  'rgba(74, 222, 128, 0.18)',
  'rgba(167, 139, 250, 0.20)',
  'rgba(244, 114, 182, 0.18)',
  'rgba(250, 204, 21, 0.18)',
  'rgba(148, 163, 184, 0.22)',
] as const
