# CanvasNotes 对话时间线

完整会话阶段、交付与关键决策归档。需求原文见 [PROMPT.md](./PROMPT.md)；版本变更见 [CHANGELOG](../CHANGELOG.md)。

- 云代理主会话：https://cursor.com/agents/bc-4f27f6c8-aed4-461b-8287-783df5b29a9f
- 公开仓库：https://github.com/kamuxiy/CanvasNotes
- 本归档对应版本：**1.3.1**

---

### 1. 立项与产品简报

- **用户意图**：Miro 式画布笔记/待办 + ComfyUI 式连接点与曲线；便签/日期/列表；自定义侧边端口；轻量、自绘边框、无系统标题栏。
- **交付**：Vite + React + TypeScript 首版画布、演示节点、贝塞尔连线、自绘标题栏；早期以可预览 Web 为主。
- **决策**：先做可运行演示，再补桌面壳；连线仅端口对端口。

### 2. 桌面客户端 / Electron

- **用户意图**：「客户端应用，不是 web」→ 明确 **exe / 独立客户端、不用浏览器**。
- **交付**：Electron 包装、自定义边框、`dev:desktop` / Windows 打包与 CI Release；品牌名定为英文 `CanvasNotes`。
- **Bugs / 决策**：画布拖动无反应 → 专用指针命中层；安装卡住 → 中文 `productName` 导致空文件名，改英文并强制显示窗口；Release **1.0.0 → 1.0.1**。

### 3. Upload Labs 卡片 + ComfyUI 曲线

- **用户意图**：卡片像 Upload Labs；对照游戏内截图改节点形状/连接位置；**连线仍用曲线**。
- **交付**：Upload Labs 风卡片与端口排布；多次迭代标签位置（外侧对齐 → 内侧裁剪 → 右标签贴右侧端口）。
- **决策**：视觉学 Upload Labs，连线坚持 ComfyUI 曲线而非正交线。

### 4. 端口对齐、溢出、顶栏 → 底栏 Dock

- **用户意图**：内容不溢出；顶栏窄窗溢出收进「更多」；默认端口改红色通用；顶栏改底部菜单，选中后出删除/复制等。
- **交付**：标签与裁剪修复；工具栏 overflow；底栏 dock；选中上下文操作；指针命中/堆叠修复使卡片可选。
- **Bugs**：选中曾被 pointer-events / 层叠挡住。

### 5. 连线规则（通用红、左↔右）

- **用户意图**：通用红可连任意色；多连；仅左↔右跨卡；禁自连与同侧。
- **交付**：放宽匹配与多连；强制方向校验。
- **并行**：建 GitHub 仓、README+配图、EXE 发布流程。

### 6. 框选、分组、节点管理、工作区

- **用户意图**：选择/框选；分组；节点管理浮窗（可无节点）；本地工作区；后修订分组遮罩/穿透/成员锁定；底栏折叠；画布空白右键新建；设置·关于与检查更新。
- **交付**：框选、分组遮罩、socket manager、工作区、dock 折叠、右键新建、设置模态与 README 同步约定；版本升至约 **1.1.x**。
- **Bugs**：分组选中后 dock 标题/取色曾未切换（测试报告后修复）。

### 7. Markdown、文本框缩放与持久化

- **用户意图**：Markdown + H1→标题；文本框四向拖大；修便签偶发无法输入。
- **交付**：Markdown 节点、四向 resize、焦点修复；预览切换曾被 pointer capture 打断 → `onPointerDown` / 按 nodeId 存预览态；演示节点挪出分组遮罩。
- **Bugs**：构建错误（BottomDock/NodeCard）；清晰度；预览按钮难点（自动化多次 FAIL，代码侧加固后继续验收）。

### 8. 焦点、装饰条、日期端口、宽度同步

- **用户意图**：满宽装饰条；去标题上方方框行；日期默认端口；拉宽文本框时控件同步变宽；布局持久化；控件右键菜单。
- **交付**：装饰条与布局清理、日期默认 socket、宽高与位置写入工作区、控件右键「控件操作」。

### 9. Figma 暗色迭代（侧边端口 → 仅底部可连）

- **用户意图**：Figma 暗色可读性预览；保留配色但节点逻辑仍底部显示；再改为**仅底部可连**；多次「还原样式 / 仅保留配色 / 还原 1.2.0」；Inter + 类型色边框，再改细半透明描边。
- **交付**：Figma 暗色板；侧边端口试验后定稿**底部端口条**；Upload Labs 节点铬 + Figma 配色；**1.2.0** 恢复点；边框与字体微调后推 GitHub。
- **决策**：配色跟 Figma；连线几何改为底部端口（取代侧边 L/R 外观）。

### 10. 七项 UX 打磨

- **用户意图**：水平拖宽、右键行为、节点管理、dock 图标、高度自适应、点外关闭、适应避开底栏（见 PROMPT 七条）。
- **交付**：去掉 `field-sizing` 等阻碍水平拖；右键仅菜单不删确认；节点管理改 modal / pointerdown 打开；dock 图标；高度自适应+可拖宽；点击控件关闭菜单；fit 考虑底栏。
- **跟进**：用户「没有看到推送」→ 再同步 GitHub。

### 11. 新建节点无限加宽修复

- **用户意图**：「新建一个控件后，控件窗口会一直自动加宽」。
- **交付**：修复测量/加宽反馈环（commit：`Fix new nodes endlessly widening from field measure loop`）。

### 12. 版本注入 + bump 脚本；同步 GitHub

- **用户意图**：每次更新 GitHub 后更新版本号与**编译时**版本号。
- **交付**：**1.3.0** — `package.json` 为唯一版本源；Vite `__APP_VERSION__` 注入关于页/更新检查；`npm run version:patch|minor|major`；electron-builder 产物名带版本；同步 GitHub。

### 13. 归档全部对话到仓库

- **用户意图**：「整理一下全部对话记录到仓库」。
- **交付（1.3.1）**：
  - `docs/history/README.md` — 索引
  - `docs/history/PROMPT.md` — 需求碎片按主题
  - `docs/history/CONVERSATION.md` — 本时间线
  - `docs/CHANGELOG.md` — Keep a Changelog 风格版本日志
  - 根目录 `Prompt.txt` 保留为历史累计粘贴；README 链到本目录
