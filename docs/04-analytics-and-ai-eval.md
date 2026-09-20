# 04｜数据分析与 AI Eval

## 1. 原则

- 先定义事件，再写界面；先验证埋点，再看报表。
- 业务数据库是事实来源，分析系统不是账本。
- 生产、测试和开发事件必须能被可靠分离。
- 不把费用备注、小票内容、邀请信息或用户联系方式发送到分析平台。
- 没有真实数据时只展示“尚无数据”，不生成示例增长曲线。

## 2. 事件契约

事件使用稳定英文名称，属性使用版本化 schema。公共属性：

- `event_id`、`event_version`、`occurred_at`
- `environment`：development / preview / staging / production
- `anonymous_or_user_id`、`household_id_hash`
- `app_version`、`platform`、`pwa_mode`

首批业务事件：

- `auth_completed`
- `household_created`
- `invite_opened`、`invite_accepted`
- `expense_draft_started`、`expense_confirmed`
- `settlement_started`、`settlement_confirmed`
- `chore_run_completed`、`chore_transfer_accepted`
- `supply_marked_low`、`supply_claimed`、`supply_stocked`
- `pwa_installed`、`push_opted_in`
- `ai_input_submitted`、`ai_proposal_generated`
- `ai_proposal_confirmed`、`ai_proposal_corrected`、`ai_proposal_abandoned`
- `ai_action_executed`、`ai_action_failed`

金额不作为默认分析属性；确需分析时只发送经产品批准的金额区间，不发送原值。

## 3. 漏斗与指标

### Onboarding

`auth_completed → household_created/invite_accepted → 第二名成员加入 → first_value_action`

### 费用闭环

`expense_draft_started → expense_confirmed → settlement_started → settlement_confirmed`

### 家务闭环

`任务生成 → 提醒送达 → completed/transfer_accepted → 下一轮生成`

### 用品闭环

`supply_marked_low → supply_claimed → supply_stocked → 关联费用确认`

### AI 辅助

`ai_input_submitted → proposal_generated → confirmed/corrected/abandoned → executed/failed`

报表按小屋而不是只按个人观察协作价值；任何“留存”“转化”结果必须注明时间窗口、分母、环境和查询版本。

## 4. AI 运行记录

每次 AI 运行记录：

- `run_id`、功能场景、模型标识、提示模板版本、tool/schema 版本。
- 输入类型和长度区间，不默认保存完整用户文本或图片。
- 结构化输出、schema 校验、业务校验、拒绝原因。
- 用户是否确认、纠正了哪些字段、最终执行结果。
- 延迟、token 使用和错误类型。

若为了诊断需要保留原始样本，必须获得明确授权、限定访问与保留时间，并支持删除。

## 5. 评估集

版本库中保存不含真实个人信息的 JSONL/JSON fixtures：

- 自然语言记账：名称、金额、付款人、参与人、日期、分类。
- 复杂分摊：等分、固定金额、比例、份数、居住天数表达、排除成员。
- 歧义与拒绝：金额缺失、成员重名、总额冲突、无权限操作。
- 家务：改期、转交、跳过、一次性与周期任务。
- 用品：报缺货、认领、采购数量、公共/私人条目区分。
- 小票：清晰/倾斜/模糊、折扣、税费、多条目和非公共条目。

样本来源只允许：人工编写的合成案例、经授权且去标识的真实失败案例。每条都记录来源类型，不能把合成样本伪装成真实用户请求。

## 6. 评估指标

- Intent accuracy：意图分类是否正确。
- Field exact match / normalized match：金额、日期、成员、条目等关键字段。
- Split validity：程序校验后金额守恒，要求 100%。
- Permission safety：无权限操作不得进入可执行状态，要求 100%。
- Confirmation coverage：高影响写操作必须出现确认，要求 100%。
- Execution consistency：同一确认单的业务结果与 domain engine 一致，要求 100%。
- Correction rate：用户修改任一关键字段的比例。
- Abandon rate、latency、cost per successful action。

准确率门槛需要在获得第一批真实/合成基线后由团队正式设定；本文件不虚构数值。

## 7. 发布门禁

模型、提示词、tool schema 或 domain 规则发生变化时：

1. 跑 domain 与数据库测试。
2. 跑固定 AI 评估集并与上一版本比较。
3. 任何金额守恒、权限、确认覆盖或执行一致性回归都阻止发布。
4. 其他指标显著下降时进行人工样本审查。
5. 通过 staging 两账号端到端测试后才能进入 production。

OpenAI 官方文档当前提示旧 Evals 平台将在 2026 年进入只读并关闭，因此 V2 不把可靠性建立在该旧平台上。采用版本库内的自有评估 harness 和可移植数据集；需要交互式实验时再使用官方当前推荐的 Datasets 能力。

参考：

- OpenAI 评估指南：<https://developers.openai.com/api/docs/guides/evals>
- OpenAI Structured Outputs：<https://developers.openai.com/api/docs/guides/structured-outputs>

