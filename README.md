<div align="center">

# 画布笔记 | CanvasNotes

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/UI-React%2019-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Desktop%20%2F%20Web-0078d7?style=flat-square&logo=electron&logoColor=white)](#)

---

轻量级 **画布笔记 / 待办** 客户端。

节点外观参考 **Upload Labs** 窗口式卡片，连线方式参考 **ComfyUI**（仅连接点之间、贝塞尔曲线）。支持 Electron 无边框桌面窗口，或仅浏览器开发预览；数据保存在本地 `localStorage`。

<br/>

<img src="docs/images/overview.svg" alt="画布总览：底部工具栏与红色通用连接点" width="920" />

</div>

---

## 功能概览

| 功能 | 说明 |
| :--- | :--- |
| 便签 / 记事本 | 标题 + 正文，适合会议纪要与短备忘 |
| 开始 / 截止日期 | 日程名称 + 起止日期 |
| 信息列表 | 可增减条目的清单节点 |
| 自定义连接点 | 左右侧端口：通用 / 相关事件 / 日期 / 相关信息 |
| 通用互通 | **红色通用**可与任意类型连接；其他类型需同色匹配 |
| 多连线 | 同一连接点可接到多个其他连接点 |
| 方向约束 | 仅允许不同卡片的左 ↔ 右；禁止自连与同侧连线 |
| 底部工具栏 | Upload Labs 风格悬浮菜单；选中后显示删除 / 复制 / +左 / +右 |
| 画布操控 | 左键拖空白平移、滚轮缩放、适应视图 |
| 无边框窗口 | Electron 自绘标题栏（最小化 / 最大化 / 关闭） |
| 本地持久化 | 自动写入 `localStorage` |

---

## 界面预览

### 选中卡片与底部菜单

选中节点后，底部 dock 出现 **删除、复制、+左、+右** 等上下文操作；卡片标题栏不再放独立删除按钮。

<img src="docs/images/duplicate.svg" alt="选中卡片后复制节点" width="920" />

### 新建连接点

通过 **+左 / +右** 打开对话框；默认类型为 **通用（红色）**。

<img src="docs/images/socket-dialog.svg" alt="新建连接点对话框，默认通用" width="920" />

---

## 快速开始

### 方式一：开发预览（Web）

```bash
git clone https://github.com/kamuxiy/CanvasNotes.git
cd CanvasNotes

npm install
npm run dev
```

浏览器打开提示地址（默认 `http://127.0.0.1:45231`）。

### 方式二：桌面客户端（Electron）

```bash
git clone https://github.com/kamuxiy/CanvasNotes.git
cd CanvasNotes

npm install
npm run dev:desktop
```

会同时启动 Vite 与无系统标题栏的 Electron 窗口。若 Vite 已在运行，可另开终端执行：

```bash
npm run desktop
```

### 方式三：生产构建

```bash
npm run build
```

产物在 `dist/`；可用 `electron .` 加载构建结果（日常开发更推荐 `npm run dev:desktop`）。

---

## 环境依赖

| 项目 | 要求 | 说明 |
| :--- | :--- | :--- |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| npm | 随 Node 附带 | 安装依赖与脚本 |
| 操作系统 | Windows / macOS / Linux | Electron 桌面与浏览器预览均可 |
| 浏览器 | Chromium 内核推荐 | 仅 Web 预览时使用 |

### 主要依赖

| 库 | 作用 |
| :--- | :--- |
| [React](https://react.dev/) | 界面 |
| [Vite](https://vite.dev/) | 开发服务器与打包 |
| [TypeScript](https://www.typescriptlang.org/) | 类型与构建 |
| [Tailwind CSS](https://tailwindcss.com/) | 样式工具链 |
| [Electron](https://www.electronjs.org/) | 桌面壳（无边框窗口） |
| [uuid](https://github.com/uuidjs/uuid) | 节点 / 连接点 ID |

---

## 项目结构

```
CanvasNotes/
├── electron/
│   ├── main.cjs                 # Electron 主进程（无边框窗口）
│   └── preload.cjs              # 预加载：窗口控制桥
├── src/
│   ├── App.tsx                  # 壳层：标题栏 / 画布 / 底部 dock
│   ├── components/
│   │   ├── BottomDock.tsx       # Upload Labs 风格底部菜单
│   │   ├── CanvasBoard.tsx      # 平移缩放、选中、拉线
│   │   ├── NodeCard.tsx         # 便签 / 日期 / 列表卡片
│   │   ├── SocketPort.tsx       # 边缘连接点
│   │   ├── SocketDialog.tsx     # 新建连接点
│   │   └── TitleBar.tsx         # 自绘标题栏
│   ├── hooks/useCanvasStore.ts  # 状态与 localStorage
│   ├── store.ts                 # 节点 / 连线规则
│   ├── types.ts                 # 类型与配色
│   └── utils/geometry.ts        # 坐标与贝塞尔路径
├── docs/images/                 # README 配图
├── package.json
└── vite.config.ts
```

---

## 使用说明

### 画布操作

| 操作 | 说明 |
| :--- | :--- |
| 底部「便签 / 日期 / 清单」 | 在视口中心附近添加节点 |
| 左键拖空白处 | 平移画布 |
| 滚轮 | 缩放 |
| 拖节点标题栏 | 移动节点 |
| 从连接点拖出 | 拉线到另一侧连接点 |
| 双击连接点 | 重命名 |
| 右键连接点 | 删除该连接点 |
| 点击连线 | 删除连线 |
| Delete / Backspace | 删除选中节点 |
| 适应 | 将全部节点适配进视口 |

### 连线规则

| 规则 | 说明 |
| :--- | :--- |
| 方向 | 仅 **左 ↔ 右**（输入 ↔ 输出），跨不同卡片 |
| 自连 | 同一卡片不允许自连 |
| 同侧 | 左连左、右连右不允许 |
| 通用（红） | 可与任意颜色类型互连 |
| 其他类型 | 仅同类型互连 |
| 多连 | 一个连接点可接到多个目标；不会挤掉已有连线 |

### 选中与底部菜单

1. 点击卡片标题栏选中（Shift 可多选）
2. 底部出现 **删除 / 复制**；单选时另有 **+左 / +右**
3. **+左 / +右** 打开「新建连接点」对话框（默认类型为通用）

---

## 参考与致谢

### 参考项目 / 设计

| 项目 | 用途 |
| :--- | :--- |
| [Upload Labs](https://store.steampowered.com/app/2764070/Upload_Labs/) | 窗口式模块卡片、边缘端口与底部工具栏观感参考 |
| ComfyUI | 仅端口连线、贝塞尔曲线交互参考 |

### 特别感谢

- 感谢 Upload Labs 的模块化节点与底部 dock 交互启发
- 感谢 ComfyUI 社区的节点连线范式
- 感谢 React / Vite / Electron / Tailwind 等开源工具链维护者

### 开源协议

本项目使用 [MIT License](LICENSE)：

- 允许个人与商业使用、修改、分发
- 分发须保留版权声明与许可文本
- 软件按「原样」提供，不附带担保

---

## 反馈

- Bug / 建议：[Issues](https://github.com/kamuxiy/CanvasNotes/issues)
- 更新说明：[Releases](https://github.com/kamuxiy/CanvasNotes/releases)

---

<div align="center">

Made by kamuXiY

画布笔记 · Upload Labs 节点风格 · Electron + React

</div>
