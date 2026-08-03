# Ctrl+Plant / Leafy AI 从零构建前端 Prompt

> 使用方式：将下面“Prompt 正文”完整复制给代码生成模型。它是独立、可移植的 greenfield prompt，不需要读取当前 Leafy AI 仓库。

## Prompt 正文

你是一名资深产品设计师、前端架构师和 React 工程师。请从一个空目录开始，设计并实现一个可运行、可测试的响应式 Web 应用：

**Ctrl+Plant — Leafy AI Farm Operations / Apple Tradeshow Demo**

它是面向室内 NFT 水培立体农场的 AI Farmer 控制台，也是一个 2.5–3 分钟的现场展会演示。请直接创建项目、编写完整代码并验证结果，不要只输出建议、线框图、伪代码或静态首页。

---

## 1. 交付目标

从零构建一个前端完整、后端可替换、默认纯内存运行的产品原型。它必须同时做到：

- 一眼说明农场是否安全、系统是否健康；
- 将 sensor 和 computer vision 信息整合成统一 Farm State；
- 清楚解释 AI 为什么提出动作；
- 明确区分模型建议与确定性安全策略的最终判断；
- 让人类审批高风险动作，并记录完整 lifecycle；
- 证明所有执行只到 Farm Simulator，绝不接触物理硬件；
- 支持六步 guided tradeshow walkthrough；
- 支持 presenter-only Demo Backstage 注入场景；
- 在 desktop、tablet、mobile 上均可完整演示；
- 页面重载后回到可信 baseline，不依赖数据库或外部服务。

应用的核心可信链路是：

**Sensors + replay images → Farm State → AI recommendation → schema validation → deterministic safety policy → human approval when required → simulator-only execution → audit trail。**

所有视觉层级、文案、交互和状态更新都应强化这条链路。

---

## 2. 技术栈与工程约束

创建一个新的项目目录，例如 `leafy-ai-frontend`，使用：

- Node.js 22.13+；
- Next.js 16 App Router；
- React 19；
- TypeScript strict mode；
- Tailwind CSS 4 或结构清晰的原生 CSS；二选一，不混用多套样式体系；
- Lucide React 图标；
- Vitest + React Testing Library，或 Node test runner + React DOM server rendering；
- ESLint；
- 可选：只在确实需要可打断 spring 时引入 `motion`；不要引入大型 UI 框架。

要求：

- 默认运行完全离线，不需要 API key、账号、数据库或网络图片；
- 不使用远程字体、外部图片热链或未经说明的第三方追踪；
- 使用本地 mock adapter，并定义清晰接口，便于将来替换为真实 backend；
- 所有写操作默认只修改浏览器内存；刷新恢复 baseline；
- 不实现真实硬件连接，不创建可被误用的 physical actuator endpoint；
- 保持 Server / Client Component 边界清晰，避免 hydration mismatch；
- 所有 domain model、demo policy、state transition 和 presentation component 分离；
- 不把整个应用塞进一个超大组件。

建议项目结构：

```text
app/
  layout.tsx
  page.tsx
  globals.css
components/
  shell/
  primitives/
  views/
  decisions/
  tradeshow/
lib/
  domain.ts
  demo-data.ts
  demo-policy.ts
  demo-engine.ts
  format.ts
  dashboard-adapter.ts
tests/
public/
README.md
```

可以根据实现需要调整，但各层职责必须清楚。

---

## 3. 产品角色与安全边界

主要用户是农场 operator 和现场 presenter。

必须在界面中持续、准确地表达：

- 当前模式为 `SIMULATION` / `SAFE REPLAY`；
- `Physical control disabled`；
- `Physical farm adapter: Offline — deliberately disabled for this demo`；
- 图片为 `SIMULATED REPLAY`，不是 live camera；
- AI 只提出建议，deterministic policy 才能决定是否允许；
- dosing pump 与 irrigation pump 始终需要人工批准；
- blocked action 永远不能批准；
- 所有所谓“执行”只更新内存中的 Farm Simulator 状态和审计记录；
- Demo Backstage 是 browser-memory-only 的 presenter scaffolding，不是生产 admin 功能。

避免模糊措辞，例如不要写 “Command sent to farm”。应写：

- `Released to farm simulator`；
- `Simulator outcome confirmed`；
- `No physical command emitted`。

---

## 4. TypeScript 领域模型

至少建立以下类型，不要用 `any`：

```ts
type SensorKind =
  | "ph"
  | "ec"
  | "solution_temperature"
  | "air_temperature";

type HealthStatus = "optimal" | "attention" | "critical";
type RiskLevel = "low" | "medium" | "high";
type AutomationMode = "running" | "paused" | "emergency_stop";
type ActionStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "executed"
  | "blocked"
  | "expired";

interface SensorReading {
  id: string;
  kind: SensorKind;
  label: string;
  value: number;
  unit: string;
  status: HealthStatus;
  trend: number;
  sparkline: number[];
  safeRange: [number, number];
  recordedAt: string;
}

interface ImageObservation {
  id: string;
  layerId: string;
  canopyCoverage: number;
  crowdingRisk: HealthStatus;
  confidence: number;
  yellowing: "none" | "low" | "moderate";
  imageQuality: "good" | "review" | "unknown";
  observedAt: string;
}

interface ProposedAction {
  id: string;
  recommendationId: string;
  actuator: "light" | "fan" | "irrigation_pump" | "dosing_pump";
  command: string;
  target: string;
  value: number;
  unit: string;
  rationale: string;
  status: ActionStatus;
  version: number;
  createdAt: string;
  expiresAt: string;
  suggestedRisk: RiskLevel;
  authoritativeRisk: RiskLevel;
  validation: {
    allowed: boolean;
    approvalRequired: boolean;
    risk: RiskLevel;
    policyVersion: string;
    reasons: string[];
    checkedAt: string;
  };
  lifecycle: Array<{
    state: string;
    label: string;
    at: string;
  }>;
  decidedBy?: string;
  decidedAt?: string;
  decisionComment?: string;
}
```

另外定义：

- `AIRecommendation`；
- `FarmLayer` 与 `DeviceState`；
- `GrowingPlan` 与 `ScheduleEvent`；
- `FarmAlert`；
- `ServiceHealth`；
- `AuditEvent`；
- `ExecutionResult`；
- `HarvestOutcome` 与 `HarvestForecast`；
- 聚合上述数据的 `DashboardSnapshot`；
- guided tour 和 Backstage 所需类型。

---

## 5. Demo safety policy

实现一个纯函数 `validateProposedAction(action, sensors, now)`，policy version 为 `leafy-demo-2026.2`。

演示规则：

| Actuator | Minimum | Maximum | Unit | Authoritative risk | Approval |
| --- | ---: | ---: | --- | --- | --- |
| light | 1 | 720 | minutes | low | no |
| fan | 1 | 180 | minutes | low | no |
| irrigation_pump | 1 | 120 | seconds | high | required |
| dosing_pump | 0.1 | 5 | millilitres | high | required |

同时验证：

- actuator 必须在 allow-list；
- unit 必须与规则一致；
- value 必须是有限数值并处于范围内；
- 必须存在 sensor evidence；
- 任一读数超过 15 分钟即视为 stale 并阻止；
- pump action 即使在范围内也必须人工批准；
- blocked action 不得被 UI 或 state engine 转成 approved/executed；
- action 执行前重新校验最新 snapshot；
- 这是 demonstration limit，README 必须注明不能直接用于真实农场。

为 policy 和非法状态转换编写单元测试。

---

## 6. 必须内置的 baseline demo data

使用固定 ISO 时间构造 deterministic snapshot，格式化显示时使用 `en-AU` 与 `Australia/Melbourne`。

### Farm summary

- Farm：`Leafy AI · Basil Bay 01`；
- Mode：`simulation`；
- System status：`healthy`；
- Automation mode：`running`；
- Farm score：`98`；
- Open alerts：`1`；
- Pending approvals：`1`。

### Sensors

提供合理的 6 小时 sparkline 和 safe range：

- pH：`5.9 pH`，optimal，trend `+0.1`；
- EC：`1.62 mS/cm`，optimal，trend `-0.04`；
- Solution temperature：`22.4 °C`，optimal，trend `+0.3`；
- Air temperature：`24.8 °C`，attention，trend `+1.2`。

### Growing plan

- Crop：Sweet basil；
- Cultivar：Genovese；
- Day：18 / 36；
- Stage：Vegetative growth；
- Next milestone：Manual channel spacing review；
- Schedule：
  - Day 1 Transplant seedlings — complete/manual；
  - Day 8 Establish nutrient routine — complete/automatic；
  - Day 18 Canopy review — complete/observe；
  - Day 21 Expand NFT channels — next/manual/human-only；
  - Day 28 Pre-harvest assessment — planned/observe；
  - Day 36 Target harvest — planned/harvest。

### Farm layers

三层各 16 株：

- Upper Canopy：coverage 62%，confidence 92%，crowding optimal；
- Middle Canopy：coverage 71%，confidence 89%，crowding optimal，yellowing low；
- Lower Canopy：coverage 84%，confidence 87%，crowding attention。

每层包含 camera、grow light、airflow 状态。Layer 3 fan 为 running，20-minute safe cycle。

如果没有真实图片素材，请创建轻量、本地、抽象的 basil canopy SVG/CSS illustration 作为 replay placeholder，并明确标注它是 simulated replay。不要使用外部图片服务，也不要假装是真实影像。

### Three canonical AI decisions

1. **Pending approval — high risk dosing**
   - Title：`Correct the EC drift conservatively`；
   - Dose `1.2 millilitres` to `shared_reservoir`；
   - Confidence 81%；
   - Evidence：EC 1.62 and falling、pH 5.9 stable、shared reservoir scope；
   - Model suggested risk：medium；
   - Policy authoritative risk：high；
   - Allowed only after explicit human approval。

2. **Executed — low risk fan**
   - Title：`Increase airflow on Layer 3`；
   - Run fan for `20 minutes`；
   - Confidence 86%；
   - Evidence：Air 24.8 °C and rising、Layer 3 coverage 84%、vision confidence 87%；
   - Policy allows simulator auto-execution；
   - Lifecycle ends with `Simulator outcome confirmed`。

3. **Blocked — excessive light extension**
   - Title：`Reject excessive light extension`；
   - Requested `960 minutes`；policy maximum `720 minutes`；
   - Confidence 94%；
   - Suggested risk low，authoritative risk high；
   - Status blocked；
   - No approve action；display `No hardware command sent`。

### Alerts, services and outcomes

- Active warning：`Air temperature trending upward`；
- Acknowledged info：`Replay vision batch complete`；
- Services：Farm state store healthy、Safety policy healthy、AI adapter healthy、Physical farm adapter offline；
- Historical yields：4320 g and 3980 g；
- Forecast：4580 g，confidence 78%，range 4210–4920 g；
- 审计事件至少覆盖 plan activation、snapshot ingestion、vision batch、policy blocked、policy allowed、simulator executed、approval pending。

---

## 7. 六个主视图

保留以下英文导航名称和产品 UI 文案。Prompt 可以是中文，但成品界面统一使用英文。

### A. Command Center

页面标题：`The farm is thinking clearly.`

首屏层级：

1. system/farm safety 状态与 simulator 边界；
2. farm score、automation mode、sync time、next analysis、alerts、approvals；
3. canopy simulated replay；
4. 四张 sensor cards；
5. 最高优先级 AI proposal；
6. growing cycle 和 service health。

每张 sensor card 包含 icon、live state、数值、单位、趋势、safe-range band、sparkline、current point 和文本 target range。图表不能只靠颜色传递状态。

### B. Farm Layers

页面标题：`Three layers. One trusted state.`

- 三层 replay cards；
- structured CV evidence；
- confidence 与 image-quality gate；
- canopy、plants、yellowing、crowding；
- camera/light/fan 状态；
- 清晰 callout：`Replay evidence, not a live camera feed`。

### C. AI Decisions

页面标题：`Every action earns its way forward.`

- 按 Needs approval、Completed、Stopped 分组；
- 每组为空时提供简短、具体的 empty state；
- action card 显示 title、actuator、target、value、risk、confidence、time、status；
- 点击 card 打开右侧 decision drawer；
- drawer 展示 explanation、evidence、deterministic policy verdict、policy reasons、version、expiry 和 lifecycle；
- pending action 可输入 comment 并 `Approve & simulate` 或 `Reject`；
- blocked action 不出现 approve button。

### D. Growing Plan

页面标题：`A routine that learns from outcomes.`

- crop、cultivar、day progress、stage、next milestone；
- schedule timeline；
- 明确区分 manual / human-only 与 automatic；
- 支持打开 plan editor，编辑 stage、milestone、date；
- 保存只更新内存并添加 audit event；
- harvest forecast 为次级区块。

### E. Safety & Alerts

页面标题：`Control never leaves the operator.`

- 当前 policy version 和 demo rule summary；
- automation mode；
- active / acknowledged alerts；
- service status；
- acknowledge alert；
- Pause、Resume、Emergency stop override；
- override 必须使用确认 dialog/sheet 并填写 reason；
- 完成后更新 mode、notice 和 audit event；
- Physical adapter offline 必须清楚可见且被表达为主动安全设置，而不是故障待修。

### F. Audit & Outcomes

页面标题：`From evidence to outcome.`

- 按时间倒序展示 event type、actor、summary、time；
- 提供 CSV export，生成并下载当前内存审计数据；
- 演示审批后在最上方插入：
  - approval approved/rejected；
  - policy revalidated；
  - simulator executed（仅批准时）；
- 次级展示 simulator results、harvest history 和 forecast。

---

## 8. 状态机与交互行为

实现清晰、可测试的状态转换，不要只替换按钮文字：

- `pending_approval → approved → executing → executed`；
- `pending_approval → rejected`；
- policy-invalid action → `blocked`，且不能离开 blocked；
- expired action 不允许审批；
- approve 时必须重新运行 policy；
- 成功审批后立即更新 decision lane、lifecycle、notice、execution result 和 audit trail；
- reject 时记录 actor、time、comment 和 audit event；
- alert acknowledgement 更新状态、actor、comment、time 和 audit；
- plan update 与 override 都生成 audit event；
- 不使用虚假网络延时或长时间 loading 动画；反馈立即发生；
- Reset demo 恢复深拷贝 baseline，不能因先前 mutation 污染初始对象。

所有高影响操作使用明确动词。不要用模糊的 `Submit` 或 `Continue` 代替 `Approve & simulate`、`Reject proposal`、`Pause automation`、`Trigger emergency stop`。

---

## 9. Guided tradeshow walkthrough

首页提供 floating launcher：

- `Start guided demo`；
- `3 minute safe replay`；
- `No data writes · no hardware`。

导览共六步，每一步导航到真实产品界面，而不是独立 slideshow：

1. `Read the farm in one glance.` → Command Center；
2. `See where the signal came from.` → Farm Layers；
3. `The model proposes. Policy decides.` → AI Decisions；
4. `Make the accountable decision.` → 打开 dosing decision drawer；
5. `Verify where automation stops.` → Approve & simulate 后进入 Safety；
6. `Close the loop with evidence.` → Audit & Outcomes。

导览 UI 必须展示当前 step、`n of 6`、进度、下一步动作、Restart 和 Exit。Restart 只重置 walkthrough 和演示审批 outcome，不影响 Backstage 中已准备的 presenter scene。

导览层不能遮挡当前步骤需要讲解的证据或按钮；mobile 时应适配底栏与 safe area。

---

## 10. Demo Backstage

顶栏提供 `Backstage`，显示 active synthetic input count。打开 presenter-only dialog/sheet，包含：

### Scenes

- Healthy baseline；
- Rising heat：Air temperature 29.1 °C / critical / +3.4，running，添加 medium-risk 30-minute Layer 3 fan review task；
- EC drift：EC 1.05 mS/cm / critical / -0.42，running，添加 high-risk 1.6 mL dosing approval task；
- Paused review：Solution temperature 24.7 °C / attention / +1.1，automation paused。

### Farm state

- 选择 sensor kind；
- 输入 value、trend；
- 选择 optimal / attention / critical；
- 选择 running / paused / emergency stop；
- 应用后 Command Center、alerts、status 和 audit 立即同步。

### AI task

- title、summary；
- actuator、target、value、unit；
- initial status：pending approval / executed / blocked；
- risk：low / medium / high；
- 注入后显示在 AI Decisions 并产生 audit event。

Backstage 必须：

- 显示 `Browser memory only`；
- 显示 `No API, database or farm hardware`；
- 支持逐项移除、Clear mode、Reset all；
- 提供 `Open Command Center` 和 `Open AI Decisions`；
- injected pending task 可以在标准 decision drawer 中审批/拒绝；
- 关闭和刷新都不能产生网络 mutation；刷新恢复 baseline。

---

## 11. 视觉设计系统

期望情绪：**calm, trustworthy, precise, alive**。

界面应像明亮、安静的植物实验室和可靠的 Apple 风格操作系统，而不是传统 enterprise admin template、暗色 cyber dashboard 或 marketing landing page。

### 基础 token

建立单一 token 来源，至少包括：

```css
:root {
  --bg: #f5f5f7;
  --surface: rgba(255, 255, 255, 0.88);
  --surface-solid: #ffffff;
  --text: #1d1d1f;
  --muted: #5f6066;
  --line: rgba(60, 60, 67, 0.14);
  --green: #248a3d;
  --green-bright: #30d158;
  --blue: #007aff;
  --amber: #a76100;
  --red: #d2302f;
  --radius-card: 24px;
  --radius-control: 13px;
}
```

可调整具体数值，但保持整体方向与 WCAG AA 对比度。

### 设计要求

- 使用 `-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`, `Helvetica Neue`, `Arial`, `sans-serif`；
- display title 使用 `clamp()`、紧凑 leading 和约 `-0.02em` tracking；
- body 使用舒适 leading；small uppercase label 使用适度正 tracking；
- desktop 左侧 navigation、top toolbar、mobile bottom bar 使用一层 translucent material；
- 数据 cards 以接近实色的表面为主；禁止 glass-on-glass；
- 大 surface 的 blur/shadow/radius 比小 control 更有重量；
- green 表达 healthy/running，blue 表达 replay/info，amber 表达 attention/approval，red 只表达 critical/blocked/emergency；
- 状态永远同时使用文字、图标/形状和颜色；
- 页面允许非常轻微的绿色 ambient glow，不使用强霓虹、过量渐变、厚重网格、纯装饰图表；
- 不把所有内容做成等尺寸卡片；通过大小、位置和留白建立主次；
- 图表只保留帮助判断的 safe band、trend、current point、label；
- icon 来自同一套 Lucide，不混用 emoji 或多种图标风格；
- 品牌可以使用 Lucide `Leaf` + `CTRL+PLANT` 文本组合，不需要生成商标图片。

---

## 12. 动效与反馈

- pointer-down 立即反馈，例如 `scale(0.97–0.985)`，不要等 click 完成；
- 动画从当前显示值开始，可被新输入打断，不锁住页面；
- drawer 从右侧进入并从右侧退出；mobile sheet 从触发位置/底部进入并原路退出；
- 普通 UI 使用无 overshoot 的 critically damped spring，参考 response `0.3–0.4s`；
- 只有真实拖拽/甩动才允许轻微 bounce；
- 动画优先使用 transform 与 opacity，避免 layout shift；
- 不添加无意义循环漂浮、呼吸、光晕扫描或大面积背景动画；
- 操作完成、警告和错误提供即时 status feedback；
- 不使用声音或震动，除非有明确价值并能与视觉反馈同帧触发。

实现：

- `prefers-reduced-motion: reduce`：取消 slide/spring/parallax，改为短 cross-fade 或静态切换；
- `prefers-reduced-transparency: reduce`：使用近实色 surface，移除 backdrop blur；
- `prefers-contrast: more`：加深文字，使用清晰边框和近实色背景。

---

## 13. 响应式布局

至少设计并实际验证：

- Desktop：1280×720；
- Tablet：820×1180；
- Mobile：390×844；
- Minimum：320px。

规则：

- Desktop：固定左侧导航 + 顶部工具栏 + 内容区；
- Tablet：收窄为 icon rail，但每项保留 accessible name / tooltip；
- Mobile：底部导航直接展示 Command、Layers、AI、Plan，More 中放 Safety、Audit；
- More menu 锚定在触发按钮上方，位于 viewport 和 safe area 内，导航后自动关闭；
- 390px 下 sensors 尽量保持两列，360px 以下切为一列；
- mobile interactive target 最小 `44×44px`；
- drawer、sheet、bottom bar 考虑 `env(safe-area-inset-bottom)`；
- 无水平滚动、无截断关键内容、无被 fixed UI 遮挡的操作；
- 1280×720 首屏必须看到核心 farm status，不得被巨大标题或空白占满；
- mobile 页面保持紧凑，不重复显示相同安全说明造成超长页面。

---

## 14. 无障碍

- 使用正确的 `header`、`nav`、`main`、`section`、`article`、`button` 和表单标签；
- icon-only button 必须有准确 `aria-label`；
- 当前导航项使用 `aria-current="page"`；
- drawer/modal/sheet 使用 `role="dialog"`、`aria-modal="true"`、`aria-labelledby`；
- 打开 dialog 后将焦点移入，关闭时返回原 trigger；
- dialog、More menu、guided tour 和 Backstage 支持 Escape；
- 实现基本 focus trap 或使用小型、可靠且可访问的 dialog primitive；
- 所有交互具有明显 `:focus-visible`；
- `role="status"` / `aria-live` 只用于需要播报的 loading、notice 和状态变化；
- chart 提供文字摘要或有效 `aria-label`；装饰图形 `aria-hidden="true"`；
- 不依赖 hover；touch、keyboard、pointer 均可完成关键流程；
- 正文和状态满足 WCAG AA；
- 不出现低于 10px 的关键可见文字；
- browser zoom / 较大字体下仍能使用。

---

## 15. 测试要求

至少覆盖：

### Policy tests

- low-risk fan in range is allowed；
- dosing in range requires approval；
- 960-minute light command is blocked；
- wrong unit is blocked；
- stale or missing sensor evidence is blocked；
- blocked action cannot execute。

### State/interaction tests

- baseline renders one pending, one executed, one blocked decision；
- approving dosing revalidates policy and adds three audit events；
- rejecting a task moves it to Stopped and records comment；
- alert acknowledgement updates state and audit；
- override requires non-empty reason；
- Reset restores an unmodified baseline；
- Rising heat and EC drift presets inject correct sensors/tasks；
- Backstage input count is correct；
- guided tour renders all six steps and follows the expected view sequence；
- tradeshow and Backstage flows perform no network mutation。

### Render/accessibility checks

- 六个 navigation labels 存在；
- simulator、safe replay、physical controls disabled、simulated replay 标签存在；
- dialog 有 accessible name；
- icon-only controls 有 label；
- blocked action 没有 approve control；
- reduced-motion 下 animated media 不自动运行。

不要以大型、脆弱的全页 snapshot 代替针对行为的测试。

---

## 16. README 与脚本

README 至少说明：

- 产品目的和完整 safety flow；
- 这是 simulator-only tradeshow demo；
- Demo Backstage 的 browser-memory-only 边界；
- 安装、启动、测试和构建命令；
- demo policy limits 仅用于样例，不可用于真实农场；
- 推荐的 2.5–3 分钟演示顺序；
- 后续接入真实 backend 时应替换 adapter，但不能绕过 policy 和 audit。

提供以下 scripts：

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

---

## 17. Definition of Done

只有同时满足以下条件才算完成：

- 从空目录完成项目初始化并能启动；
- 六个视图完整可用；
- guided tour 六步能启动、前进、审批、查看安全边界、查看审计、退出和重启；
- Backstage 四个 scenes、自定义 sensor/mode/task、逐项移除、Reset 和 Present 入口工作；
- decision approve/reject、alert acknowledge、plan update、override、CSV export 均真实更新内存状态；
- blocked action 永不可批准；pump action 必须人工批准；执行只进入 simulator；
- 所有 replay、no-write 和 physical-disabled 标签准确存在；
- 1280×720、820×1180、390×844、320px 无水平溢出或 fixed UI 遮挡；
- mobile 可见操作目标不少于 44×44px；
- keyboard、Escape、focus return、screen-reader label 和系统辅助偏好工作；
- typecheck、lint、tests、production build 全部通过；
- 不需要网络、凭证或数据库即可复现完整演示；
- 不遗留模板占位文案、未连接按钮、console error、TypeScript error 或明显的视觉假功能。

---

## 18. 执行与最终汇报格式

开始前：

1. 用简短清单说明工程结构、状态模型和实施顺序；
2. 然后直接创建文件并实现，不要等待我逐项确认。

完成后按以下结构汇报：

1. **Outcome**：一句话概括交付成果；
2. **Architecture**：说明组件、domain、policy、state engine 和 adapter 如何分层；
3. **Product flows**：说明六个视图、guided tour 和 Backstage；
4. **Safety preserved**：逐项说明 no hardware、policy、approval、blocked、audit 边界；
5. **Responsive & accessibility**：列出实际验证视口和交互；
6. **Verification**：列出 typecheck、lint、tests、build 的真实结果；
7. **Run locally**：给出最短启动命令；
8. **Remaining risks**：仅列真实未完成项，没有则写 `None within the simulator scope`。

请把它当作真实产品原型来实现：功能、信息层级、安全语义、动效、响应式和测试同等重要。最终结果必须是一个可直接运行和现场演示的应用，而不是一组漂亮但不可交互的页面。
