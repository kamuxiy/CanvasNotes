export type SocketKind = 'generic' | 'event' | 'date' | 'info'
export type SocketSide = 'left' | 'right'
export type NodeKind = 'note' | 'date' | 'list'

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

export type NodeData = NoteData | DateData | ListData

export interface CanvasNode {
  id: string
  kind: NodeKind
  x: number
  y: number
  width: number
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
}

export const SOCKET_COLORS: Record<SocketKind, string> = {
  generic: '#ff4d5e',
  event: '#ff9a3c',
  date: '#3ec7ff',
  info: '#4ade80',
}
