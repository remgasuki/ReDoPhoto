---
description: 每次完成 bug 修复或小功能添加后，自动执行版本递增、打包、GitHub 推送、README 更新和 Release 发布的完整流程
alwaysApply: true
---

# 版本发布与更新流程规则

## 触发条件

当一个任务会话完成，且任务内容属于以下类型时，**必须**自动执行本规则定义的发布流程：
- 修复 bug
- 添加小功能/特性
- 代码重构（影响用户可见行为）

**不触发**的场景：纯文档修改、代码格式化、配置调整等不影响功能的变更。

## 执行步骤

按以下顺序依次执行，任何一步失败则停止并报告错误：

### 第 1 步：递增版本号

- 读取 `package.json` 中的 `version` 字段
- 递增**小版本号**（patch）：例如 `1.0.2` → `1.0.3`
- 如果是较大的功能更新，递增**中版本号**（minor）：例如 `1.0.3` → `1.1.0`
- 将新版本号写入 `package.json`

```
修改: package.json → "version": "新版本号"
```

### 第 2 步：清理 + 构建 + 打包

依次执行以下命令：

```bash
node scripts/clean-dist.js
npx electron-vite build
npx electron-builder --win --config
```

- 第一步清理 `dist/` 目录中所有旧版 `.exe` 文件
- 确认 `dist/ReDoPhoto <版本号>.exe` 文件已生成且仅保留该最新版本
- 如果构建失败，报告错误信息并停止流程

### 第 3 步：更新 README.md（如适用）

- 如果本次变更包含用户可见的新功能或行为变化，更新 `README.md` 相关章节
- 如果是纯 bug 修复且不影响文档描述，可跳过此步

### 第 4 步：Git 提交与推送

```bash
git add -A
git commit -m "v<版本号>: <简要描述本次变更内容>"
git push origin main
```

- 如果当前分支不是 `main`，推送到当前分支
- 如果推送失败（如远程有更新），先执行 `git pull --rebase origin <分支名>` 再重试

### 第 5 步：创建 GitHub Release

使用 GitHub CLI (`gh`) 创建版本发布：

```bash
gh release create v<版本号> "dist/ReDoPhoto <版本号>.exe" --title "ReDoPhoto <版本号>" --notes "<变更说明>"
```

- Release tag 格式：`v<版本号>`（如 `v1.0.3`）
- Release title 格式：`ReDoPhoto <版本号>`（如 `ReDoPhoto 1.0.3`，不含中文）
- Release notes 应简要描述本次变更内容（用中文书写）
- 上传 `dist/ReDoPhoto <版本号>.exe` 作为发布资产（注：GitHub 不支持空格，资产文件名用连字符 `ReDoPhoto-<版本号>.exe`）
- 如果 `gh` CLI 不可用，提供手动创建 Release 的链接：`https://github.com/remgasuki/ReDoPhoto/releases/new`

## 错误处理

| 失败步骤 | 处理方式 |
|----------|---------|
| 构建打包失败 | 报告编译错误，回滚 `package.json` 版本号，停止流程 |
| Git 推送失败 | 提示用户检查网络/权限，尝试 `git pull --rebase` 后重试 |
| Release 创建失败 | 提供手动创建链接，不阻塞流程 |

## 输出格式

流程完成后，输出以下摘要：

```
✅ 版本发布完成
- 版本号: <旧版本> → <新版本>
- 构建产物: dist/ReDoPhoto <新版本>.exe (<文件大小>)
- Git: 已推送到 origin/<分支名>
- GitHub Release: <链接>
- 变更内容: <简要描述>
```
