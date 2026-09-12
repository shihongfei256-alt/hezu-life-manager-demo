# 搭子屋 合租生活管家

一个面向年轻合租群体的现代产品型网页 Demo。核心流程覆盖共同费用、家务轮值、用品采购、成员规则与本地数据管理。

界面采用 Tailwind CSS 4、Motion 与 Three.js 构建：使用响应式 Bento Dashboard、克制的玻璃质感、细边框、轻阴影、噪点纹理，以及低干扰的粒子与线框几何氛围。

## 当前能力

- 今天：聚合当前成员的家务、采购、待付款和规则确认事项，指标全部实时计算。
- 费用：参与成员、四种分摊方式、整数分计算、净余额、建议转账、详情、结算和作废。
- 家务：新增轮值、负责人、截止时间、完成、撤销、逾期、换班和完成记录。
- 用品：新增用品、低库存、唯一认领、购买金额、确认入库和自动生成共同费用。
- 更多：成员、版本化规则、通知、JSON 导出、备份恢复和示例数据重置。

## 本地运行

```bash
pnpm install
pnpm dev
```

生产构建使用 `pnpm build`，产物输出至 `dist`。应用使用 Hash 路由和相对资源路径，兼容 GitHub Pages 子路径。

## 数据

业务数据保存在浏览器 `localStorage` 的 `hezu-life-manager:v2:state`。首次打开会迁移旧的 `roomie-expenses`、`roomie-chores` 和 `roomie-supplies`，并保留迁移前备份。

## 测试

```bash
node --test tests/domain.test.mjs
```

## 回退

现代化改版前的版本已保存在 Git 分支与标签 `backup-before-modern-ui-20260912`，并在本地 `backups` 目录保留完整仓库 bundle 和旧版构建压缩包。

## 已知边界

当前版本是单设备作品集 Demo，不包含真实账号、云端多人同步、系统推送或支付能力。
