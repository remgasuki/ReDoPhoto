# ReDoPhoto — Windows 桌面照片去重应用

## Context
用户需要一个 Windows 桌面应用，用于导入照片文件夹、检测重复/相似照片、通过可视化对比手动选择保留策略，最终执行去重操作。技术栈选用 Electron + React，检测方式可配置（默认 SHA-256 精确匹配，可选 pHash 相似检测）。

## 技术栈
- **框架**: Electron 33+ (通过 electron-vite 脚手架)
- **前端**: React 18 + TypeScript + Tailwind CSS
- **状态管理**: Zustand
- **图像处理**: sharp + sharp-phash (pHash 感知哈希)
- **文件哈希**: Node.js crypto (SHA-256)
- **设置持久化**: electron-store
- **构建**: electron-vite + electron-builder

## 架构概览

```
Main Process (Node.js)          ←→  IPC Channel  ←→  Renderer Process (React)
├── scanner.service.ts (文件夹扫描)                    ├── stores/ (Zustand 状态)
├── hash.service.ts (SHA-256/pHash)                   ├── hooks/ (useScan, useDedup)
├── dedup.service.ts (分组+执行)                       ├── components/ (UI 组件)
└── settings.service.ts (设置)                         └── 通过 window.api 调用
Preload Script: contextBridge 桥接，暴露类型安全 API
```

## 实现任务

### Task 1: 项目脚手架搭建
- 使用 `npm create @quick-start/electron` 初始化 react-ts 模板
- 安装依赖: `sharp`, `sharp-phash`, `zustand`, `electron-store`
- 集成 Tailwind CSS (`npx tailwindcss init -p`)
- 验证 `npm run dev` 正常启动

### Task 2: 主进程服务层
- **`scanner.service.ts`**: 递归遍历文件夹，过滤图片扩展名 (.jpg/.jpeg/.png/.gif/.bmp/.webp/.tiff)，返回 FileInfo[]
- **`hash.service.ts`**: 
  - SHA-256: 流式读取 + crypto.createHash，分批(20个/批) + setImmediate 让出事件循环
  - pHash: sharp-phash 计算感知哈希，Union-Find 按汉明距离分组
- **`dedup.service.ts`**: 分组逻辑 + Copy 模式(复制到新文件夹) + Delete 模式(原位删除)
- **`settings.service.ts`**: electron-store 持久化设置(哈希模式/输出模式/后缀名)

### Task 3: IPC 通信层
- **IPC Handlers**: `folder:select`, `folder:scan`, `hash:computeAll`, `phash:computeAll`, `dedup:group`, `dedup:execute`, `settings:get/set`, `file:thumbnail`
- **进度推送**: `scan:progress`, `hash:progress`, `dedup:progress` (主进程 → 渲染进程)
- **Preload Bridge**: `contextBridge.exposeInMainWorld('api', {...})` 暴露类型安全 API

### Task 4: React UI 框架
- **布局**: 4步向导式 (导入 → 扫描 → 对比 → 执行)
- **Zustand Stores**: scanStore(扫描状态), dedupStore(重复组/决策), settingsStore(设置)
- **通用组件**: Button, Modal, ProgressBar, Toast

### Task 5: 核心功能 UI
- **FolderPicker**: 文件夹选择 + 扫描进度 + 摘要
- **CompareView + ImagePair**: 左右并排对比，每组提供"保留左/右"按钮
- **BatchActions**: "全部保留左侧"/"全部保留右侧" 批量操作栏
- **SettingsPanel**: 哈希模式切换、pHash 阈值滑块、输出模式选择、输出文件夹后缀输入

### Task 6: 去重执行
- 确认对话框 → 执行 Copy/Delete → 进度条 → 完成摘要
- Copy 模式默认输出文件夹名: `{原文件夹名}New`，可修改

### Task 7: 错误处理与优化
- React ErrorBoundary + IPC try-catch 错误处理
- 文件权限错误跳过并记录
- 大文件夹虚拟滚动 (react-window)
- 缩略图缓存 + 取消操作支持

## 关键设计

### 检测模式(可配置，默认精确匹配)
- **精确匹配(SHA-256)**: 文件内容哈希完全一致 → matchType: 'exact'
- **相似检测(pHash)**: 感知哈希汉明距离 < 阈值(默认5) → matchType: 'similar'
- **组合模式**: 先 SHA-256 分组，再对独立文件计算 pHash 补充相似组

### 输出模式
- **Copy(默认)**: 创建 `{folder}New` 文件夹，保留文件复制过去，重复文件不复制
- **Delete**: 直接删除用户标记为不保留的文件（需二次确认）

## 验证方式
1. `npm run dev` 启动应用，完整走一遍：选择文件夹 → 扫描 → 对比 → 执行 Copy 模式
2. 准备含完全相同文件的文件夹测试 SHA-256 检测
3. 开启 pHash 模式，测试不同分辨率/压缩率的同一照片检测
4. 测试批量操作（全部保留左/右）和混合决策
5. 测试 Delete 模式的二次确认和实际删除
6. 测试大文件夹(100+张)的进度条和 UI 响应性
