# 证件照功能模块实现计划

## Context

ReDoPhoto 是一款 Electron 桌面照片管理工具，现有照片去重、智能批量重命名、无损旋转/裁剪三个功能模块。需要新增第四个"证件照制作"功能，支持选择热门证件照尺寸、上传照片、交互式裁剪、背景色选择，最终生成标准尺寸的证件照。

## 架构概述

遵循现有模式：每个功能有独立的 store、service、组件目录，通过 IPC 通信，使用 sharp 处理图片。证件照功能为单文件工作流（非文件夹批量），流程为：导入 → 预览裁剪 → 执行生成 → 完成。

---

## Task 1: 定义类型和常量

**新建** `src/renderer/src/types/idphoto.ts`
- `IdPhotoSizePreset` 接口（key, label, widthMm, heightMm, widthPx, heightPx, dpi, format, category）
- `BgColorOption` 接口（key, label, colorValue）
- `CropRect` 接口（x, y, width, height）
- `IdPhotoProcessParams` 接口（sourcePath, outputPath, cropRect, targetWidthPx, targetHeightPx, bgColor, outputFormat, quality）
- `IdPhotoProgress` 接口
- 热门尺寸常量数组（1寸、2寸、小1寸、小2寸、大1寸、大2寸、护照、美国签证等）
- 背景色选项常量数组（无、白色、蓝色、红色）

## Task 2: 更新导航 store

**修改** `src/renderer/src/stores/navStore.ts`
- Feature 类型添加 `'idphoto'`

## Task 3: 创建证件照 Zustand store

**新建** `src/renderer/src/stores/idphotoStore.ts`
- 阶段：`import | preview | executing | done`（无 scanning，因为是单文件）
- 状态：sourcePath, sourceImageBase64, sourceWidth/Height, selectedPreset, selectedBgColor, cropRect, outputPath, result, error
- 所有 setter + reset

## Task 4: 更新设置系统（4 个文件）

**修改** `src/main/services/settings.service.ts`
- 添加 `IdPhotoConfig { outputFormat: 'jpg'|'png', quality: number }`
- 添加到 `AppSettings` 和 `DEFAULT_SETTINGS`

**修改** `src/renderer/src/types/index.ts`
- 添加 `IdPhotoConfig`，更新 `AppSettings`

**修改** `src/preload/index.ts`
- 添加 `IdPhotoConfig` 接口，更新 `AppSettings`

**修改** `src/renderer/src/stores/settingsStore.ts`
- defaultSettings 添加 `idphoto: { outputFormat: 'jpg', quality: 95 }`

## Task 5: 创建主进程服务

**新建** `src/main/services/idphoto.service.ts`
- `processIdPhoto(params, onProgress?)` 函数
- 使用 sharp 管线：`.rotate()` → `.extract(cropRect)` → `.resize(targetW, targetH)` → `.withMetadata({ density: dpi })` → `.jpeg/png({quality}).toFile(outputPath)`
- `getImageInfo(filePath)` 函数：返回 `{ width, height, format }`

## Task 6: 注册 IPC 处理器

**修改** `src/main/ipc/index.ts`
- `file:selectImage` — 选择单个图片文件
- `file:imageInfo` — 获取图片原始尺寸
- `file:saveDialog` — 保存文件对话框
- `idphoto:process` — 调用 processIdPhoto 服务

## Task 7: 更新 Preload API

**修改** `src/preload/index.ts`
- 添加 `selectImage`, `getImageInfo`, `showSaveDialog`, `processIdPhoto`, `onIdPhotoProgress` 方法
- 导出 `IdPhotoProcessParams`, `IdPhotoProgress` 类型

**修改** `src/preload/index.d.ts`
- 添加类型导出和 `ElectronAPI` 接口方法声明

## Task 8: 创建 UI 组件（4 个文件）

**新建** `src/renderer/src/components/idphoto/IdPhotoFeature.tsx`
- 阶段路由组件，同 OrientationFeature 模式

**新建** `src/renderer/src/components/idphoto/IdPhotoImport.tsx`
- 照片选择区（点击调用 selectImage + getThumbnail + getImageInfo）
- 尺寸选择网格（按类别分组，每个卡片显示标签、mm、px、DPI）
- 背景色选择行（色圆点 + 标签）
- "预览裁剪"按钮

**新建** `src/renderer/src/components/idphoto/IdPhotoPreview.tsx`
- 左侧：Canvas 交互裁剪区
  - 加载 base64 缩略图到 Image → Canvas
  - 暗色遮罩 + 裁剪窗口（锁定目标宽高比）
  - 支持拖动、缩放裁剪区域
  - 三分线辅助构图
- 右侧：信息面板（尺寸详情、裁剪区域尺寸、背景色预览、输出缩略图预览）
- 底部按钮："返回" / "选择保存位置并生成"

**新建** `src/renderer/src/components/idphoto/IdPhotoExecute.tsx`
- executing 阶段：加载动画
- done 阶段：成功/失败展示，输出文件缩略图，"重新开始"按钮

## Task 9: 集成到现有 UI

**修改** `src/renderer/src/components/Sidebar.tsx`
- menuItems 添加 `{ key: 'idphoto', label: '证件照制作', icon: ... }`

**修改** `src/renderer/src/App.tsx`
- 导入 IdPhotoFeature，添加 `activeFeature === 'idphoto'` 条件渲染

**修改** `src/renderer/src/components/SettingsPanel.tsx`
- 添加 `activeFeature === 'idphoto'` 设置区（输出格式选择、质量滑块）

## Task 10: 构建验证

- 运行 `npx electron-vite build` 确保编译通过

---

## 文件变更汇总

**新建文件（7）：**
| 文件 | 用途 |
|---|---|
| `src/renderer/src/types/idphoto.ts` | 类型定义和常量 |
| `src/renderer/src/stores/idphotoStore.ts` | 状态管理 |
| `src/main/services/idphoto.service.ts` | 主进程图片处理服务 |
| `src/renderer/src/components/idphoto/IdPhotoFeature.tsx` | 阶段路由 |
| `src/renderer/src/components/idphoto/IdPhotoImport.tsx` | 导入页 |
| `src/renderer/src/components/idphoto/IdPhotoPreview.tsx` | 裁剪预览页 |
| `src/renderer/src/components/idphoto/IdPhotoExecute.tsx` | 执行/结果页 |

**修改文件（10）：**
| 文件 | 变更 |
|---|---|
| `navStore.ts` | Feature 类型加 `'idphoto'` |
| `App.tsx` | 导入+渲染 IdPhotoFeature |
| `Sidebar.tsx` | 添加菜单项 |
| `SettingsPanel.tsx` | 添加证件照设置区 |
| `settingsStore.ts` | 添加默认值 |
| `types/index.ts` | 添加 IdPhotoConfig |
| `settings.service.ts` | 添加 IdPhotoConfig + 默认值 |
| `ipc/index.ts` | 添加 4 个 IPC 处理器 |
| `preload/index.ts` | 添加 API 方法+类型导出 |
| `preload/index.d.ts` | 添加 API 类型声明 |

## 技术要点

- **裁剪**：Canvas 交互在渲染进程完成，裁剪坐标为原图像素坐标，发送给主进程 sharp 处理
- **DPI 元数据**：使用 `.withMetadata({ density: 300 })` 嵌入打印 DPI
- **自动旋转**：sharp `.rotate()` 先于 extract，确保裁剪坐标与视觉一致
- **背景色**：v1 仅支持 `.flatten()` 替换 alpha 通道透明区域；非透明背景替换需 AI 分割，标记为未来功能
- **缩略图**：复用现有 `getThumbnail` IPC 获取 base64 预览图（限制 800px），避免大图画布卡顿

## 验证方式

1. `npx electron-vite build` 编译无错
2. `npx electron-vite dev` 启动，点击侧边栏"证件照制作"进入功能
3. 选择一张照片 → 选择1寸 → 选择蓝色背景 → 预览裁剪 → 拖动调整 → 保存生成
4. 验证输出文件的像素尺寸和 DPI 是否正确
5. 切换 7 种主题验证 UI 可读性
