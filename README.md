# 搭子屋 2.0

搭子屋 2.0 是面向 2–5 人合租小屋的多人协作 Web App 项目。它不是 V1 的改版分支，而是一个独立产品与独立代码库；现有 V1 保持原样，继续作为已发布的静态演示版本。

## 产品承诺

让合租里原本需要室友反复沟通、催促和对账的事情，交给搭子屋后更容易形成清楚、可追溯、可结清的公共事实。

核心闭环：

- 费用：记账 → 分摊 → 欠款 → 结算 → 双方确认结清
- 家务：排班 → 提醒 → 完成或转交 → 自动生成下一轮
- 用品：库存 → 缺货 → 认领采购 → 入库 → 生成共同费用

## 当前可运行版本

当前版本已经可以在手机和桌面浏览器中直接使用，无需邮箱或密码。首次点击“直接进入梧桐里 3B”后会创建匿名访客会话，数据保存在当前设备的浏览器中。

已实现：

- 今日行动单和响应式手机底部导航、桌面三栏工作台
- 费用新增、整数分均分、按成员结算和结清状态
- 家务完成、转交、完成后自动生成下一轮负责人
- 用品缺货、认领采购、完成入库并一次性生成共同费用
- 成员、邀请体验、合租规则、通知与安静时段、活动记录
- PWA manifest、基础离线缓存和桌面图标入口
- 业务型智能入口：自然语言生成操作确认单，确认后再由确定性程序执行

智能入口当前使用本机规则解析来验证“理解 → 确认 → 执行”产品闭环，不冒充已接入在线大模型。模型、票据识别和真实多人同步将在云端阶段接入。

## 本地启动

```bash
pnpm install
pnpm dev
```

默认访问 `http://localhost:3000`。也可以直接运行质量检查：

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm qa:visual
pnpm qa:flow
```

`qa:flow` 已覆盖访客进入、整数分分摊、新增费用、按成员结算、家务自动轮值、认领采购、入库自动记账、刷新持久化、智能确认后记账和通知偏好。

## 产品与技术文档

本目录包含：

- [现状审计](./docs/00-discovery-audit.md)
- [产品蓝图](./docs/01-product-blueprint.md)
- [技术架构](./docs/02-technical-architecture.md)
- [开发路线与验收标准](./docs/03-delivery-roadmap.md)
- [数据分析与 AI Eval 方案](./docs/04-analytics-and-ai-eval.md)

## 已冻结的边界

- V1 仓库 `hezu-life-manager-demo` 不迁移、不覆盖、不删除。
- V2 使用新的本地目录、新的 GitHub 仓库、新的部署项目和新的后端环境。
- PWA 是交付形态，不考虑 App Store 上架。
- AI 只负责理解意图和生成候选操作；金额计算、权限判断、状态迁移及写入由确定性程序执行。
- 会改变共同数据或账务状态的 AI 操作，必须先展示可审阅的确认单。
- 分析与评估只记录真实运行事件或明确标识的测试样本，不伪造用户量、转化率、准确率或测试结论。

## 技术基线

- Web：Next.js App Router、React、TypeScript、Tailwind CSS、Radix/shadcn 风格组件、Motion
- 数据：Supabase Auth + PostgreSQL + Row Level Security + Realtime + Storage + Cron/Edge Functions
- 业务：独立 TypeScript domain package，金额统一使用整数分
- AI：OpenAI Responses API、函数调用/结构化输出、视觉输入、服务端密钥
- 测试：Vitest、fast-check、Playwright、Supabase 本地集成测试、axe
- 交付：GitHub Actions、Vercel、Supabase；生产与预览环境隔离

当前前端使用 Next.js App Router、React、TypeScript、Tailwind CSS、Motion 和独立领域包；金额统一使用整数分。云端阶段按架构文档接入 Supabase、OpenAI Responses API、分析事件与 AI Eval。
