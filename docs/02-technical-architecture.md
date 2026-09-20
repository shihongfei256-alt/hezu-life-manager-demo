# 02｜技术架构

## 1. 架构决策

V2 使用模块化单体，而不是提前拆微服务。前端、服务端路由、领域包和数据库迁移保存在同一 monorepo 中；账务、家务、用品、成员、通知和 AI 保持清楚的模块边界。

```text
手机浏览器 / 已安装 PWA
          │ HTTPS
Next.js Web + BFF（Vercel）
  ├─ UI / Route Handlers
  ├─ Domain Application Services
  ├─ AI Proposal Orchestrator
  └─ Analytics Adapter
          │
Supabase
  ├─ Auth
  ├─ PostgreSQL + RLS + RPC Transactions
  ├─ Realtime private channels
  ├─ Storage（私有小票）
  └─ Cron / Edge Functions（提醒与通知）
          │
OpenAI Responses API（仅服务端）
```

选择原因：当前团队需要快速完成真实多人协作，Supabase 能在一个可管理的底座中提供 Auth、Postgres、RLS、Realtime、Storage 和定时任务；核心业务仍由我们自己的领域层和数据库事务掌控，避免把账务正确性托付给 UI 或模型。

## 2. 推荐仓库结构

```text
搭子屋-v2/
├─ apps/
│  └─ web/                 # Next.js App Router + PWA
├─ packages/
│  ├─ domain/              # 纯 TypeScript 业务规则与状态机
│  ├─ ui/                  # 设计令牌和可复用组件
│  ├─ ai/                  # Proposal schema、提示版本、评估器
│  ├─ analytics/           # 事件契约与供应商适配层
│  └─ config/              # lint、TypeScript、测试共享配置
├─ supabase/
│  ├─ migrations/
│  ├─ functions/
│  ├─ seed.sql             # 仅开发环境 fixture
│  └─ tests/               # RLS / RPC 集成测试
├─ tests/
│  └─ e2e/
└─ docs/
```

## 3. 前端技术

- Next.js App Router + React + TypeScript。
- Tailwind CSS 负责令牌化样式；Radix/shadcn 风格 primitive 负责可访问性交互，不复制默认视觉皮肤。
- Motion 只用于反馈、连续性和 Sheet/列表状态变化；支持 `prefers-reduced-motion`。
- TanStack Query 管理服务端缓存、失效和乐观更新；表单使用 React Hook Form + Zod。
- URL 表示可分享/可恢复的筛选和详情状态；临时 UI 状态尽量保持局部，不引入全局状态仓库作为默认答案。
- 图标统一使用同一线性图标库并固定 1.75–2px 笔画；头像无照片时使用首字母或几何头像。

## 4. 数据模型

所有业务表使用 UUID、`household_id`、创建者和时间戳；可并发修改的聚合增加 `version`。金额使用整数分 `bigint`，禁止浮点金额。

### 身份与小屋

- `profiles`
- `households`
- `household_members`：`owner/admin/member`、加入/离开状态
- `household_invitations`：令牌哈希、角色、过期时间、使用次数
- `house_rules`、`house_rule_acceptances`：规则版本不可覆盖

### 费用

- `expenses`：总额、付款人、日期、分类、状态、冲正引用
- `expense_shares`：每位参与人的整数分金额
- `settlements`：付款人、收款人、金额、`pending/confirmed/cancelled`
- `settlement_allocations`：结算金额分配到具体费用分摊

余额和结清状态从不可变明细派生；高频查询可使用受测试保护的只读视图或汇总表。

### 家务

- `chore_templates`：频率、轮值成员、规则
- `chore_runs`：某一轮的负责人、截止时间、状态、版本
- `chore_transfers`：发起人、接手人、待接受/接受/拒绝
- `chore_events`：完成、撤销、跳过等审计事实

### 用品

- `supply_items`：当前数量、目标数量、提醒阈值
- `supply_claims`：唯一有效认领约束
- `inventory_movements`：入库、消耗、校准的不可变流水
- `purchase_records`：采购数量、金额、关联 `expense_id` 和附件

### 通知、活动与 AI

- `activity_events`：面向成员的共同操作时间线
- `notification_outbox`、`notifications`、`push_subscriptions`
- `attachments`：私有对象路径、类型、上传人
- `ai_proposals`：输入哈希、意图、结构化草稿、状态、过期时间
- `ai_runs`：模型/提示版本、延迟、token、校验结果，不保存不必要的原始敏感文本
- `ai_feedback`：确认、纠正、放弃与纠正字段
- `idempotency_keys`：高影响写入的请求去重

## 5. 权限与安全

- 所有暴露表启用 RLS；策略以 `auth.uid()` 和有效 `household_members` 为基础。
- `anon` 不读取任何小屋业务数据；服务端 secret 永不进入浏览器。
- 邀请令牌只存哈希，设置过期与使用限制；接受邀请在事务中完成。
- 小票存入私有 bucket，使用短期签名 URL。
- 账务、成员、规则和采购完成通过服务端 application service / Postgres RPC 执行，不允许客户端自由拼装多表写入。
- 每个高影响写请求携带幂等键；聚合更新使用版本号防止静默覆盖。
- 活动记录不替代安全审计；管理操作保留独立审计字段。
- 日志和分析事件不得写入完整小票、备注原文、邀请令牌、邮箱或手机号。

## 6. Realtime 与一致性

- PostgreSQL 是唯一事实来源，Realtime 只负责让其他室友更快看到变化。
- 私有频道按小屋划分，授权跟随 RLS；规模增长时优先数据库触发的 Broadcast。
- 客户端收到事件后使对应 Query 失效并重新读取，不把 WebSocket 消息当最终账本。
- 关键 mutation 返回新的 `version` 和业务结果；版本不匹配时显示冲突说明和刷新入口。
- 费用确认、结算确认、采购入库+生成费用必须在单一事务中完成。

## 7. PWA 策略

- App Router manifest、图标、HTTPS、主题色和 `display: standalone`。
- Service Worker 缓存 app shell、静态资源和最近读取的非敏感页面数据。
- Alpha 阶段离线只保证打开应用和查看最近同步内容；费用确认、结算、采购入库等写操作要求联网。
- 可离线编辑的内容先保存为“本机草稿”，恢复网络后必须再次校验和确认，不静默同步账务。
- Web Push 在用户理解价值后再请求权限，支持安静时段和分类开关。
- iOS 安装提示使用平台说明，不依赖不兼容的统一安装弹窗。

## 8. AI 执行层

- 浏览器把文本/压缩后的图片上传给 V2 服务端；OpenAI API key 只存在服务端环境。
- Responses API 把输入解析为严格 JSON Schema 的 `Proposal` 或函数调用参数。
- `packages/domain` 根据当前小屋快照计算分摊、轮值与库存影响，并拒绝不存在的成员、无权限操作、金额不守恒或过期状态。
- UI 呈现可编辑确认单；确认时携带 proposal ID、快照版本和幂等键。
- 服务端重新读取最新状态、重新计算并执行事务，不能信任浏览器提交的最终金额。
- 小票识别保留每个字段/条目的可修改状态；低置信度只作为 UI 提醒，不能自动入账。

## 9. 测试与质量门

- Domain：迁移 V1 的 26 个行为测试，补充 property-based 金额守恒、轮值和库存不变量。
- Database：RLS 的允许/拒绝矩阵；事务回滚；邀请过期；唯一认领；幂等重放。
- Component：表单、Sheet、确认单、空/错/加载/离线/权限状态。
- E2E：两名浏览器用户加入同一小屋并完成三条闭环。
- Accessibility：键盘、焦点、对比度、44px 触控区、axe 自动检查和手动读屏抽查。
- Performance：移动网络下首屏和核心交互预算；小票上传单独计量。
- Security：依赖扫描、secret 扫描、RLS 回归和生产前威胁模型复查。

## 10. 部署环境

- `preview`：每个 PR 独立前端预览，连接专用测试 Supabase 项目或分支。
- `staging`：内部验收、演示和匿名化测试样本。
- `production`：真实用户数据；禁止 seed 和测试事件混入分析。
- GitHub 只保存源代码和迁移，不保存密钥。

V1 继续使用原 GitHub Pages 链接；V2 建立独立 GitHub 仓库、Vercel 项目、Supabase 项目和域名。面向中国大陆真实公测前，需要单独验证网络可达性、短信/邮件交付、数据地域和合规要求；该决策不应在未经验证时伪装成已解决。

## 11. 参考依据

- Next.js PWA 指南：<https://nextjs.org/docs/app/guides/progressive-web-apps>
- Supabase Row Level Security：<https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase Realtime Authorization：<https://supabase.com/docs/guides/realtime/authorization>
- Supabase 数据库变更订阅：<https://supabase.com/docs/guides/realtime/subscribing-to-database-changes>
- Supabase Cron：<https://supabase.com/docs/guides/cron>
- OpenAI Structured Outputs：<https://developers.openai.com/api/docs/guides/structured-outputs>
- OpenAI 图像与视觉输入：<https://developers.openai.com/api/docs/guides/images-vision>

