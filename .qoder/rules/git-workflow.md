# ReDoPhoto Git 工作流程规范

## 每日启动规范

每天首次打开此项目时，**必须首先执行以下同步操作**，确保本地代码与 GitHub 远程仓库（`https://github.com/remgasuki/ReDoPhoto.git`）保持一致：

```bash
cd d:\dev\qoder\redophoto
git pull origin main
```

执行后验证：
- 确认输出无冲突（`Already up to date` 或成功 merge）
- 如有冲突，按「冲突处理」章节解决后再开始开发工作

## 变更提交流程

当完成 bug 修复或新功能开发，并且**测试验证通过后**，按以下步骤提交到 GitHub：

### 步骤 1：检查本地变更

```bash
git status
git diff --stat
```

确认变更内容符合预期，不包含调试代码或临时文件。

### 步骤 2：拉取远程最新代码

提交前必须先同步远程，防止版本冲突：

```bash
git pull origin main
```

- 如果拉取成功无冲突 → 继续步骤 3
- 如果产生冲突 → 按「冲突处理」章节解决后再继续

### 步骤 3：暂存变更

```bash
git add .
```

### 步骤 4：提交

提交信息使用以下格式：

| 类型 | 格式 | 示例 |
|------|------|------|
| 新功能 | `feat: 简要描述` | `feat: 添加拖拽导入文件夹功能` |
| Bug 修复 | `fix: 简要描述` | `fix: 修复 pHash 计算溢出问题` |
| 文档 | `docs: 简要描述` | `docs: 更新 README 使用说明` |
| 重构 | `refactor: 简要描述` | `refactor: 优化哈希计算性能` |
| 配置 | `chore: 简要描述` | `chore: 升级 electron 版本` |

```bash
git commit -m "<type>: <description>"
```

### 步骤 5：推送

```bash
git push origin main
```

推送后确认输出中无错误。

## 提交时机规范

**只在以下情况提交推送**：
- 新功能开发完成，且功能测试通过
- Bug 修复完成，且回归测试通过（原有功能未被破坏）
- 用户明确指示提交

**禁止在以下情况提交**：
- 功能未完成或存在已知问题
- 仅做了部分修改，中间状态
- 用户未确认测试结果

## 冲突处理

### 检测冲突

执行 `git pull` 时如果出现如下输出，说明存在冲突：

```
CONFLICT (content): Merge conflict in <file>
Automatic merge failed; fix conflicts and then commit the result.
```

### 解决步骤

1. 使用 `git status` 查看所有冲突文件
2. 打开冲突文件，定位 `<<<<<<<` `=======` `>>>>>>>` 标记
3. 向用户展示冲突内容，由用户决定保留哪部分
4. 手动编辑文件解决冲突后：

```bash
git add <resolved-file>
git commit -m "merge: 解决 <file> 冲突"
git push origin main
```

### 预防冲突

- 每次开发前先 `git pull` 同步最新代码
- 避免多人同时修改同一文件
- 小步提交，频繁同步

## 注意事项

- 本项目使用 `main` 作为主分支，所有开发均直接在 `main` 分支上进行（个人项目，无需分支策略）
- `.gitignore` 已排除 `node_modules/`、`out/`、`dist/` 等构建产物，不要手动提交这些目录
- 推送前确保 `npm run build` 构建成功
- 大文件（如 .exe 安装包）不要提交到仓库，通过 GitHub Releases 发布
