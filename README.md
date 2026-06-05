# ReDoPhoto

Windows 桌面照片管理应用 —— 快速识别并清理重复/相似照片，智能批量重命名，修复照片方向问题。

## 功能特性

### 1. 照片去重

提供三种检测模式：

| 模式 | 算法 | 说明 |
|------|------|------|
| **精确匹配** | SHA-256 | 基于文件内容哈希，仅检测完全相同的文件 |
| **相似检测** | pHash | 基于感知哈希 + DCT 变换，检测视觉相似的照片 |
| **组合模式** | SHA-256 + pHash | 同时使用两种方式，结果合并分组 |

- SHA-256 采用流式计算，分批处理，内存占用低
- pHash 支持自定义相似度阈值（1-15，值越大越宽松）
- pHash 使用 Union-Find 并查集进行高效分组
- 左右分屏对比，支持像素级同步缩放/平移查看细微差异
- 手动选择保留策略：单组操作或批量操作
- 两种输出模式：复制到新文件夹 / 原位删除

### 2. 智能批量重命名

- 基于照片 EXIF 数据自动生成有意义的文件名
- 提取拍摄时间、GPS 地理位置信息
- 地理位置自动反向解析为地名（需联网，通过 OpenStreetMap Nominatim）
- 可自定义文件名格式：`{date}_{location}_{seq}`
- 支持多种日期格式：`YYYY-MM-DD`、`YYYYMMDD`、`YYYY-MM-DD_HHmm`
- 预览表格视图，支持手动编辑单个文件名
- 按地点自动分组编号
- 两种输出模式：复制到新文件夹（使用新名称） / 原位重命名

### 3. 无损旋转/裁剪元数据清理

- 读取 EXIF Orientation 方向元数据
- 使用 sharp 引擎根据方向信息自动旋转像素数据
- 修复在旧版软件中方向显示错误的问题
- 清晰标注每个文件的方向状态（正常/需修复）
- 用户可选择性修复，支持全选/单选
- 两种输出模式：复制到新文件夹（仅修复的文件） / 原位覆盖修复

### 4. 侧边栏导航

- 左侧固定导航栏，三个功能菜单一键切换
- 每个功能独立管理状态，切换时保留进度
- 设置面板按功能分区显示，上下文感知

### 5. 通用功能

- **主题颜色**：7 种主题颜色（深灰、白色、米色、天蓝、深蓝、克莱因蓝、灰色）
- **文件夹导入**：递归扫描所有子文件夹，支持 JPG、PNG、GIF、BMP、WebP、TIFF
- **设置持久化**：所有偏好自动保存，重启后恢复
- **进度反馈**：实时进度条和文件计数

## 技术栈

| 技术 | 说明 |
|------|------|
| **Electron 33+** | 跨平台桌面应用框架 |
| **React 18** | 用户界面构建 |
| **TypeScript** | 类型安全的开发体验 |
| **Tailwind CSS** | 原子化 CSS 样式 |
| **Zustand** | 轻量级状态管理 |
| **sharp** | 高性能图像处理（缩略图/旋转） |
| **exifr** | 高性能 EXIF 元数据解析 |
| **electron-store** | 设置持久化存储 |
| **electron-vite** | 构建工具链 |

## 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── index.ts             # 应用入口
│   ├── ipc/                 # IPC 通信处理
│   └── services/            # 核心服务
│       ├── scanner.service.ts       # 文件夹扫描
│       ├── hash.service.ts          # 哈希计算
│       ├── dedup.service.ts         # 去重处理
│       ├── rename.service.ts        # 重命名服务
│       ├── orientation.service.ts   # 方向修复服务
│       └── settings.service.ts      # 设置管理
├── preload/                 # 预加载脚本（安全桥接）
│   ├── index.ts             # contextBridge
│   └── index.d.ts           # 类型声明
└── renderer/                # 渲染进程（UI）
    └── src/
        ├── App.tsx          # 根组件（侧栏+主区域）
        ├── components/      # UI 组件
        │   ├── Sidebar.tsx          # 侧边栏导航
        │   ├── SyncImageViewer.tsx  # 同步缩放对比
        │   ├── dedup/               # 去重功能
        │   ├── rename/              # 重命名功能
        │   └── orientation/         # 方向修复功能
        ├── stores/          # Zustand 状态
        └── types/           # 共享类型
```

## 快速上手

1. 前往 [Releases](https://github.com/remgasuki/ReDoPhoto/releases) 页面下载最新版 `ReDoPhoto x.x.x.exe`
2. 双击运行，无需安装
3. 在左侧侧边栏选择需要的功能，按提示操作即可

## 开发者指南

### 环境要求

- Node.js 18+
- npm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 打包绿色版 .exe

```bash
npm run build:win
```

产物位于 `dist/ReDoPhoto x.x.x.exe`，双击即可运行。

## 许可证

MIT
