# Ctrl+Plant / Leafy AI 前端实现 Prompt

> 使用方式：将下面“Prompt 正文”完整复制给前端代码生成模型。该 prompt 面向当前仓库的增量开发，不是从零创建新项目。

## Prompt 正文

你是一名资深产品设计师兼前端工程师。请在现有代码库中继续完善 **Ctrl+Plant — Leafy AI Apple Tradeshow Demo v0.2**，交付一个可运行、可测试、适合 2.5–3 分钟现场演示的响应式 Web 控制台。

### 1. 工作目录与执行方式

- 目标目录：`leafy_ai_sample_apple_tradeshow_v0.2`。
- 先阅读并理解现有实现，再修改代码；不要另起一个平行项目。
- 优先检查：
  - `README.md`
  - `docs/tradeshow-demo-script.md`
  - `docs/apple-design-notes.md`
  - `docs/frontend-iteration-log.md`
  - `app/components/LeafyDashboard.tsx`
  - `app/components/TradeshowTour.tsx`
  - `app/components/TradeshowBackstage.tsx`
  - `app/components/tradeshow-state.ts`
  - `app/globals.css`
  - `lib/domain.ts`
  - `lib/demo-data.ts`
  - `tests/*.test.tsx`
- 保留当前 Next.js / React / TypeScript 架构，在原组件和设计系统上迭代。
- 开始改动前先说明你识别出的页面结构、关键安全边界和准备修改的文件；完成后汇报改动、测试结果和仍存在的风险。

### 2. 产品背景

Leafy AI 是面向 La Trobe University 室内 NFT 水培立体农场的“AI Farmer”控制台。它读取 EC、pH、营养液温度、空气温度和分层摄像头证据，生成结构化建议，并通过确定性安全策略决定动作是：

1. 低风险，可进入模拟执行；
2. 中高风险，必须等待人工审批；
3. 越过安全边界，直接阻止。

前端必须清楚表达完整可信链路：

**传感器/视觉证据 → 统一 Farm State → AI 建议 → 确定性策略校验 → 人工审批（如需要）→ 仅模拟器执行 → 审计与结果。**

用户应在几秒内回答四个问题：

- 农场现在是否安全？
- AI 为什么提出这个动作？
- 哪些动作正在等待我决定？
- 动作最终在哪里执行，是否留下审计记录？

### 3. 不可突破的安全边界

- 这是 **persistent simulator / safe replay**，不是物理农场控制界面。
- 所有执行必须停在经过验证的 Farm Simulator；界面不得暗示已连接或已控制真实硬件。
- 回放图片和视频必须明确标注 `SIMULATED REPLAY` 或等价文案，不能伪装成实时摄像头。
- AI 不能绕过确定性安全策略；策略的风险判断是 authoritative，模型自报风险不是最终结论。
- dosing、irrigation 等高风险操作必须展示证据、策略理由、版本、有效期和人工审批状态。
- 被策略阻止的动作不能出现可批准入口。
- 人工 override 必须要求理由，并进入审计链路。
- Demo Backstage 仅用于展会演示：状态只存在 React/browser memory，刷新即重置；不得写 API、数据库或硬件，也不得把 Backstage 包装成生产管理员功能。
- 不要改动安全策略、认证、数据库 schema、API payload、适配器或物理集成行为，除非发现阻塞前端运行的明确 bug；如确需修改，先说明原因和影响。

### 4. 信息架构：保留六个产品视图

#### A. Command Center

这是默认首页和最高优先级页面。首屏应突出：

- 总体 farm score、系统健康和 automation mode；
- `Physical control disabled` / simulator 边界；
- 最新同步时间、下次分析时间、开放告警数、待审批数；
- 四张 sensor cards：Air temperature、EC、pH、Solution temperature；
- 每张卡包含当前值、单位、趋势、状态、6 小时 sparkline 和 safe range；
- 当前最重要的高风险 AI proposal、解释、证据、函数、目标、参数、authoritative risk 和进入审批详情的入口；
- 当前 growing cycle、下一里程碑和 service health；
- Layer 03 的 canopy replay / CV 证据摘要。

视觉顺序必须先回答“是否安全”，再回答“为什么”，最后提供深入入口。不要把所有卡片做成相同权重。

#### B. Farm Layers

- 展示 Upper / Middle / Lower 三层数字孪生；
- 每层包含 replay 图像、CV confidence、canopy coverage、crowding risk、yellowing、image quality、plant count；
- 展示 camera、grow light、airflow 等设备状态与模式；
- 明确说明这是 replay evidence，不是 live camera feed；
- 图像质量不合格时，视觉证据不能被表现为可信决策输入。

#### C. AI Decisions

- 使用清晰的状态分组呈现 `pending_approval`、`executed/approved`、`blocked/rejected` 等动作；
- 空分组必须有简短空状态，不能留下无解释的大面积空白；
- 卡片必须显示标题、动作、目标、参数、风险、置信度、创建时间和状态；
- 打开详情时，从触发卡片所在方向进入右侧 drawer；关闭时沿原路径返回；
- drawer 必须展示 AI explanation、evidence、policy verdict、policy reasons、lifecycle、版本和过期时间；
- 对待审批动作提供 `Approve & simulate` 和 `Reject`，要求用户能补充 comment；
- 被 blocked 的动作只展示阻止原因和审计信息，不提供批准按钮。

#### D. Growing Plan

- 展示 Sweet basil / Genovese 当前 crop cycle、day progress、stage、next milestone；
- 用清晰 timeline 区分 completed、next、planned，以及 manual、observe、automatic、harvest；
- 人工任务（例如扩展 NFT channels）必须明确标记为 human-only；
- 编辑计划使用可访问的 modal/sheet，保持现有字段和 API 契约；
- harvest forecast 属于次要内容，不得抢占安全与审批的主层级。

#### E. Safety & Alerts

- 展示 deterministic safety policy、automation mode、active/acknowledged alerts、service degradation 和 physical adapter offline 状态；
- pause、resume、emergency stop 等 override 必须使用明确动词和风险层级；
- 破坏性或高影响操作使用确认 sheet，并要求填写理由；
- 不只依赖颜色表达 warning / critical / acknowledged；图标、标签和文本含义必须同时存在。

#### F. Audit & Outcomes

- 以时间倒序展示 evidence、proposal、validation、approval、execution、block、alert 和 plan 事件；
- 每条记录至少显示时间、actor、event type 和 summary；
- 支持现有 CSV export；
- 展示 simulator execution result、harvest history 和 forecast，但审计链路优先；
- 演示审批完成后，顶部应立即出现 approval、policy revalidation、simulator completion 三类事件。

### 5. Tradeshow 演示层

保留并打磨六步 guided walkthrough：

1. Read the farm in one glance；
2. See where the signal came from；
3. The model proposes. Policy decides；
4. Make the accountable decision；
5. Verify where automation stops；
6. Close the loop with evidence。

具体要求：

- 首页提供 `Start guided demo`，同时说明 `3 minute safe replay` 和 `No data writes`；
- 每一步将用户导航到对应真实产品视图或详情，不制作脱离产品的幻灯片；
- 当前步骤、总步骤、下一步动作和退出/重启入口始终清楚；
- Restart walkthrough 只重置导览进度，不应误删 presenter 已配置的 Backstage scene；
- 完成审批后跳转到 Safety，再进入 Audit，形成完整闭环；
- 导览层不能遮挡当前需要讲解的核心证据和操作。

### 6. Demo Backstage

Backstage 是 presenter-only 演示工具，保留三类能力：

- Scenes：Healthy baseline、Rising heat、EC drift、Paused review；
- Farm state：注入/替换 sensor reading、status、trend、automation mode；
- AI task：设置 actuator、target、value、initial status、risk，并把任务送到 AI Decisions。

交互要求：

- 明确显示 `Browser memory only` 和 `No API, database or farm hardware`；
- 顶栏按钮显示当前 synthetic input 数量；
- 支持逐项移除、全部 Reset、Open Command Center、Open AI Decisions；
- injected pending task 可打开、批准或拒绝，并立即移动到相应状态分组、生成 synthetic audit event；
- Backstage 的视觉层级应与产品区分，但仍属于同一设计语言；建议使用更重的 material、明确的 operator label 和边界说明。

### 7. 视觉方向

整体气质：**calm, trustworthy, precise, alive**。它应像一间明亮、安静的植物实验室和可靠的 Apple 风格操作系统，而不是传统企业后台、暗色赛博驾驶舱或营销落地页。

- 使用系统字体栈：`-apple-system`, `BlinkMacSystemFont`, `SF Pro Display`, `SF Pro Text`, `Helvetica Neue`, `Arial`, `sans-serif`；不引入远程字体依赖。
- 主色为克制的 basil green；blue 用于 replay / information；amber 用于 attention / approval；red 只用于 blocked、critical 和 emergency。
- 页面背景轻盈、有空气感；可使用非常弱的绿色环境光，不使用强烈霓虹、厚重网格、过量渐变或大面积纯黑。
- 固定导航、顶部工具栏、移动底栏可使用单层半透明 material；数据卡片以接近实色的高可读表面为主。禁止 glass-on-glass。
- 大卡片比小控件拥有更强 blur、阴影和厚度；所有阴影克制且来源一致。
- 大标题紧凑、略带负 tracking；正文保持舒适 leading；小标签适度正 tracking。所有关键文案必须易读。
- 使用现有 Ctrl+Plant logo、farm layer 图片和 Remotion 预渲染 MP4/poster，不下载或生成无关素材。
- 数据图表保持简洁：safe-range band、趋势线、current point 和文本摘要同时存在；不为了“科技感”堆叠装饰图形。
- 避免通用模板感：不要把所有信息塞进等尺寸卡片，不要重复相同图标容器，不要使用无意义统计数字。

建议沿用/整理现有设计 token，不要在 stylesheet 尾部继续叠加覆盖层：

- background：`#f5f5f7` 附近；
- primary text：`#1d1d1f`；
- basil green：`#248a3d` / `#30d158`；
- system blue：`#007aff` / `#0a84ff`；
- warning amber：`#a76100`；
- critical red：`#d2302f`；
- card radius：约 `20–24px`；
- control radius：约 `12–14px`；
- desktop content width 与密度应适合 1280×720 展会屏幕，不能让首屏只剩标题。

### 8. 动效与反馈

- 所有按钮在 pointer-down 时立即反馈，可使用约 `scale(0.97–0.985)` 和轻微亮度变化；不要等 click 后才反馈。
- 动效服务于状态理解，默认克制、可打断，不阻塞输入。
- drawer、sheet、popover 从触发源或固定空间方向出现，并沿同一路径退出。
- 可交互的 sheet/drawer 优先使用无明显 overshoot 的 spring；参考 `damping 1.0`、`response 0.3–0.4s`。
- 只有由拖拽/甩动产生的动效才允许轻微 bounce；普通菜单和 modal 不要弹跳。
- 导航切换、状态更新和操作完成需要即时、明确的 status feedback；不要用人为延时制造“AI 正在工作”的假象。
- 动画只操作 `transform` 和 `opacity` 等合成友好属性；避免造成 layout shift。
- `prefers-reduced-motion: reduce` 下禁用视频自动播放、弹性、滑移和视差，改为 poster + 短 cross-fade 或静态切换。
- `prefers-reduced-transparency: reduce` 下提高表面不透明度并移除 blur。
- `prefers-contrast: more` 下使用近实色背景、清晰边框和更强文本对比。

### 9. 响应式行为

至少验证以下视口：

- Desktop：1280×720；
- Tablet：820×1180；
- Mobile：390×844；
- 最小宽度：320px。

要求：

- Desktop 使用左侧导航 + 顶部工具区；Tablet 可收窄为带 accessible name 的 icon rail；Mobile 使用底部导航。
- Mobile 底栏直接提供 Command、Layers、AI、Plan；Safety 和 Audit 放入锚定在 More 按钮上方的菜单。
- mobile More menu 必须在 viewport 和 safe-area 内，导航后自动关闭，Escape 可关闭。
- 不得出现水平滚动；关键数据不因屏幕变窄而被隐藏。
- 390px 下 sensor grid 在仍可读时保持两列，360px 以下再切一列。
- 所有 mobile interactive target 最小 `44×44px`。
- bottom navigation、drawer、sheet 和 sticky controls 必须考虑 `env(safe-area-inset-bottom)`。
- 页面密度要适合现场快速演示；避免移动端出现不必要的超长空白或重复说明。

### 10. 可访问性

- 使用语义化 `header`、`nav`、`main`、`section`、`article`、`button`、`dialog/aside`。
- 所有 icon-only control 提供准确 `aria-label`；当前导航项使用 `aria-current="page"`。
- dialog/drawer/sheet 使用 `role="dialog"`、`aria-modal="true"` 和可解析的 `aria-labelledby`。
- 打开 dialog 后将焦点移入；关闭后尽量返回触发控件；支持 Escape 关闭；不得意外提交表单。
- 所有交互提供清晰 `:focus-visible`；不能移除键盘焦点轮廓。
- loading、notice、automation mode、sync state 等动态反馈使用合适的 `role="status"` / `aria-live`，避免重复播报。
- 颜色不是唯一状态信号；状态同时使用文案、图标或形状。
- 图表提供可读 `aria-label` 或文本摘要；装饰图形使用 `aria-hidden="true"`。
- 正文与背景满足 WCAG AA；不要出现低于 10px 的可见关键文本。
- 保持英文产品 UI 文案，不要自行翻译或混用中英文。

### 11. 技术与状态约束

- 继续使用 React 19、Next.js 16、TypeScript、Lucide React 和现有 CSS；没有必要不要引入新的 UI 框架或状态库。
- 复用 `lib/domain.ts` 的类型和 `lib/demo-data.ts` 的数据；不要在组件中创建另一套不兼容的数据模型。
- 保持现有 API 契约：
  - `GET /api/dashboard`
  - `POST /api/approvals`
  - `PATCH /api/growing-plan`
  - `POST /api/alerts/ack`
  - `POST /api/overrides`
- 正常产品交互继续通过现有 handler/API；Tradeshow guided replay 与 Backstage synthetic input 必须保持纯内存、no-write。
- 刷新失败时保留可信 demo snapshot，并向用户呈现错误状态，不要让页面崩溃或变空。
- 所有时间按 Australia/Melbourne / `en-AU` 的现有格式逻辑展示。
- MP4 是预渲染视觉资产，不要把 Remotion runtime 加入浏览器 bundle。
- 保持 Server/Client component 边界正确，不引入 hydration mismatch。
- 如果拆分 `LeafyDashboard.tsx`，按视图和共享 primitive 合理拆分，保持行为和测试可追踪；不要为了抽象而抽象。
- 清理明显重复、冲突或只靠后置 override 生效的 CSS，形成单一可信的 token 和 responsive rule 来源，但不要无意改变已经验证的布局。

### 12. 实施优先级

按以下顺序工作：

1. 保证六视图、guided tour、Backstage 和关键交互均不回归；
2. 强化 simulator / physical disabled / replay evidence 安全表达；
3. 优化 Command Center 首屏层级和 2.5–3 分钟演示路径；
4. 统一 token、卡片、按钮、状态、表单、drawer 和 sheet；
5. 完善 desktop/tablet/mobile 响应式；
6. 完善 keyboard、screen reader、reduced motion/transparency/contrast；
7. 最后才添加非必要装饰或微动效。

### 13. 验收标准

只有满足以下条件才算完成：

- 六个导航视图均能正常打开且内容完整；
- guided demo 六步可启动、前进、审批、进入 Safety、进入 Audit、退出和重启；
- Backstage 四个 preset、自定义 farm state、自定义 AI task、逐项移除、Reset 和两个 Present 入口正常；
- injected task 审批/拒绝后状态分组和 audit event 同步更新；
- 任何 tradeshow 操作都不发 mutation request，不写 D1，不接触物理 Farm API；
- blocked action 不可批准，高风险 action 必须人工决定；
- 1280×720、820×1180、390×844、320px 均无水平溢出和遮挡；
- 390px 下无小于 44×44px 的可见交互目标，无低于 10px 的关键可见文本；
- mobile More、decision drawer、plan editor、override confirmation、Backstage 均支持键盘操作和 Escape 关闭；
- reduced-motion 模式使用静态 poster，核心信息与反馈仍然存在；
- 不破坏现有 API、domain types、authentication、safety policy、database 和 deployment 配置；
- 执行并通过：

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

若已有测试不足以覆盖本次改动，请补充聚焦行为的测试，不要用脆弱的大型快照测试代替交互断言。

### 14. 最终输出格式

完成实现后，请按以下格式汇报：

1. **Outcome**：一句话说明用户现在得到什么；
2. **Changed**：按页面/组件列出实质改动；
3. **Safety preserved**：说明 simulator、approval、policy、Backstage no-write 边界如何保持；
4. **Responsive & accessibility**：列出实际验证的视口、键盘和系统偏好；
5. **Verification**：逐项列出 typecheck、lint、unit tests、build 结果；
6. **Remaining risks**：只列真实存在的问题，不写泛泛建议。

不要只返回设计建议、伪代码或静态 mockup。请直接在现有项目中完成可运行实现，并用测试和视口验证结果证明它。
