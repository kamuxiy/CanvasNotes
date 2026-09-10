/** Central app metadata shown in Settings → About. Keep version in sync with package.json. */
export const APP_META = {
  displayName: '画布笔记',
  productName: 'CanvasNotes',
  author: 'kamuXiY',
  version: '1.1.0',
  description: '画布笔记桌面客户端 — Upload Labs 风格节点 + ComfyUI 式连线',
  license: 'MIT',
  githubUrl: 'https://github.com/kamuxiy/CanvasNotes',
  githubRepo: 'kamuxiy/CanvasNotes',
  releasesUrl: 'https://github.com/kamuxiy/CanvasNotes/releases',
  stack: [
    { name: 'React', version: '19.2.8' },
    { name: 'TypeScript', version: '6.0.2' },
    { name: 'Vite', version: '8.2.2' },
    { name: 'Electron', version: '33.2.1' },
    { name: 'Tailwind CSS', version: '4.3.3' },
    { name: 'electron-builder', version: '25.1.8' },
  ],
} as const
