# 贡献指南

感谢你愿意改进每日运势。

## 开始之前

1. 使用 Node.js 22.12.0 或更高版本。
2. Fork 仓库并从默认分支创建功能分支。
3. 先搜索已有 Issue，避免重复工作。
4. 大型功能或行为变更请先创建 Issue 讨论。

## 本地开发

```bash
npm install
npm run dev
```

请保持改动聚焦，不要提交 `data/`、`dist/`、`node_modules/` 或任何真实个人资料。

## 提交前检查

```bash
npm run check
npm audit --audit-level=high
```

修复缺陷时应补充能够复现问题的测试；修改 API 时应覆盖成功和失败路径。

## Pull Request

Pull Request 请说明改动解决的问题、主要实现方式、验证结果，以及界面改动的桌面端和移动端截图。

提交即表示你有权提供这些改动。许可证确定前，维护者会在合并前与你确认贡献的使用条款。
