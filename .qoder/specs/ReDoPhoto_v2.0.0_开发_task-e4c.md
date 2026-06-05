
# ReDoPhoto v2.0.0 实施计划

## Context

当前 ReDoPhoto 是单一功能的照片去重工具（v1.0.5），使用线性向导流（import→scanning→comparing→executing→done）。v2.0.0 需要将其升级为多功能照片管理工具，新增侧边栏导航、智能重命名、方向元数据清理三大功能模块，并增强现有对比功能的交互体验。

## Task 1: 安装依赖 + 设置系统重构

**目标**: 将扁平 `AppSettings` 重构为按功能分组的嵌套结构，安装 `exifr` 依赖。

```
npm install exifr
```

**修改文件**:
- `src/main/services/settings.service.ts` — AppSettings 重构为嵌套结构 + 迁移逻辑 + deepMerge
- `src/preload/index.ts` + `src/preload/index.d.ts` — 同步更新类型 + 新增 API
- `src/renderer/src/types/index.ts` — 同步更新前端类型

**新 AppSettings 结构**:
```ts
interface AppSettings {
  dedup: { hashMode, phashThreshold, outputMode }
  rename: { outputMode: 'copy'|'rename-in-place', nameFormat, dateFormat, separator }
  orientation: { outputMode: 'copy'|'fix-in-place' }
  outputFolderSuffix: string  // 全局
  themeColor: ThemeColor      // 全局
}
```

迁移策略：`getSettings()` 检测旧格式（顶层 `hashMode` 存在），自动迁移并写回。

## Task 2: 侧边栏导航 + App 布局重构

**目标**: 添加左侧导航侧边栏，重构 App 布局为 sidebar + main。

**新建文件**:
- `src/renderer/src/stores/navStore.ts` — `{ activeFeature: 'dedup'|'rename'|'orientation', setFeature }`
- `src/renderer/src/components/Sidebar.tsx` — 左侧 220px 导航栏，3 个菜单项 + 图标

**修改文件**:
- `src/renderer/src/App.tsx` — 布局改为 `TitleBar / (Sidebar | main)`，基于 `activeFeature` 条件渲染功能容器
- `src/renderer/src/components/TitleBar.tsx` — Logo/名称迁移到 Sidebar，精简为拖拽区+设置按钮
- `src/main/index.ts` — 窗口宽度 1400→1500，minWidth 1000→1100

## Task 3: 去重功能适配新布局

**目标**: 将现有去重流程封装为独立 Feature 组件，适配新 settings 路径。

**新建文件**:
- `src/renderer/src/components/dedup/DedupFeature.tsx` — 去重功能顶层容器（phase 条件渲染）

**修改文件**:
- `src/renderer/src/components/ImportStep.tsx` — `settings.hashMode` → `settings.dedup.hashMode`
- `src/renderer/src/components/ExecuteStep.tsx` — `settings.outputMode` → `settings.dedup.outputMode`
- `src/renderer/src/components/SettingsPanel.tsx` — 分区显示：全局(主题/后缀) + 按 activeFeature 显示功能设置
- `src/main/ipc/index.ts` — cachedFiles 按功能隔离（改为 Map 或直接传参）

## Task 4: 像素级同步对比预览（Feature 3）

**目标**: 在 CompareStep 中添加同步缩放/平移功能。

**新建文件**:
- `src/renderer/src/components/SyncImageViewer.tsx` — 共享 transform 状态（scale/translateX/translateY），滚轮缩放(1x-10x)，拖拽平移，双击重置，CSS transform GPU 加速

**修改文件**:
- `src/renderer/src/components/CompareStep.tsx` — GroupCard 中增加"同步对比"切换按钮，启用时用 SyncImageViewer 替代静态图片

## Task 5: 智能批量重命名（Feature 1）

**目标**: 基于 EXIF 数据自动生成有意义的文件名。

**新建文件**:
- `src/main/services/rename.service.ts` — EXIF 提取(exifr)、reverse geocoding(Nominatim API)、文件名生成、执行重命名/复制
- `src/renderer/src/stores/renameStore.ts` — renamePhase: import→scanning→preview→executing→done
- `src/renderer/src/components/rename/RenameFeature.tsx` — 顶层容器
- `src/renderer/src/components/rename/RenameImport.tsx` — 文件夹选择 + 设置
- `src/renderer/src/components/rename/RenamePreview.tsx` — 表格预览(原名→新名)，支持手动编辑，地点分组
- `src/renderer/src/components/rename/RenameExecute.tsx` — 执行进度 + 结果

**修改文件**:
- `src/main/ipc/index.ts` — 新增 `rename:scanExif`, `rename:geocode`, `rename:preview`, `rename:execute` + progress 事件
- `src/preload/index.ts` + `index.d.ts` — 新增对应 API 暴露

**关键实现**:
- EXIF: `exifr.parse(path, { pick: ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude'] })`
- Geocoding: Nominatim API，1req/sec 限流，坐标精度缓存(四舍五入到0.01°≈1km)
- 无 EXIF 日期用文件修改时间 fallback
- 文件名冲突加后缀 `_1`, `_2`
- rename-in-place 模式需检测循环依赖，用临时名过渡

## Task 6: 无损旋转/裁剪元数据清理（Feature 2）

**目标**: 读取 EXIF Orientation，使用 sharp 旋转像素并清除 orientation tag。

**新建文件**:
- `src/main/services/orientation.service.ts` — `scanOrientations`(exifr 读取 Orientation tag) + `fixOrientations`(sharp.rotate() 自动修正)
- `src/renderer/src/stores/orientationStore.ts` — orientationPhase: import→scanning→preview→executing→done
- `src/renderer/src/components/orientation/OrientationFeature.tsx` — 顶层容器
- `src/renderer/src/components/orientation/OrientationImport.tsx` — 文件夹选择
- `src/renderer/src/components/orientation/OrientationPreview.tsx` — 列表显示 orientation 状态，勾选要修复的文件
- `src/renderer/src/components/orientation/OrientationExecute.tsx` — 执行进度 + 结果

**修改文件**:
- `src/main/ipc/index.ts` — 新增 `orientation:scan`, `orientation:fix` + progress 事件
- `src/preload/index.ts` + `index.d.ts` — 新增对应 API

**关键实现**:
- `sharp(filePath).rotate().toFile(output)` — 无参 rotate() 自动根据 EXIF 旋转并移除 tag
- copy 模式输出到 `{folder}_{suffix}/`
- fix-in-place 模式写临时文件再替换
- orientation=1 或无 tag 的文件跳过

## Task 7: 版本发布 v2.0.0

- `package.json` 版本号 `1.0.5` → `2.0.0`，description 更新
- 更新 README.md（新增功能介绍、使用说明）
- 清理 + 构建 + 打包：`node scripts/clean-dist.js` → `npx electron-vite build` → `npx electron-builder --win --config`
- Git commit + push
- GitHub Release 创建

## 实施顺序

```
Task 1 (Settings重构) → Task 2 (Sidebar布局) → Task 3 (去重适配)
                                                    ↓
                                              Task 4 (同步对比)
                                                    ↓
                                              Task 5 (批量重命名)
                                                    ↓
                                              Task 6 (旋转清理)
                                                    ↓
                                              Task 7 (发布)
```

## 验证方式

每个 Task 完成后运行 `npm run dev` 验证：
- Task 1-3: 侧边栏显示3个菜单，去重流程完整可用，设置面板分区正确
- Task 4: 对比页面可切换同步模式，缩放/平移/重置正常
- Task 5: 选择文件夹→扫描EXIF→预览新旧文件名→执行重命名/复制
- Task 6: 选择文件夹→扫描方向→预览→执行修复
- Task 7: 构建产物可运行，所有功能端到端测试
