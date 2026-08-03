# Leafy AI Tradeshow Demo Script

## Format

- Target length: 2.5–3 minutes.
- Starting point: Command Center with the guided demo launcher visible.
- Safety guarantee: this build uses the built-in replay and performs no mutation requests.

## Presenter flow

### Backstage setup (before the visitor arrives)

Select **Backstage** in the top toolbar. For the default guided story, keep
**Healthy baseline**. For an adaptive conversation, choose **Rising heat** or
**EC drift**, or build a custom state in **Farm state** and **AI task**.

Use **Open Command Center** to present sensor and mode changes, or **Open AI
Decisions** to present an injected task. The blue counter on the Backstage
button confirms how many synthetic inputs are active.

### 1. Trusted farm state

Select **Start guided demo**. Explain that sensors, canopy replay and service
health reconcile into one trusted state before AI reasoning begins.

### 2. Evidence layer

Select **Inspect visual evidence**. Point out that camera frames are explicitly
labelled as replay evidence and converted into confidence-scored observations.

### 3. Explainable AI

Select **Follow the AI proposal**. Show the typed dose, model confidence and the
policy engine's authoritative high-risk classification.

### 4. Human decision

Select **Open the decision**. Review evidence, policy reasons and lifecycle, then
select **Approve & simulate** either in the guide or the decision drawer.

### 5. Safety boundary

Explain that the action is revalidated and reaches only the farm simulator.
Physical control remains disabled throughout the demonstration.

### 6. Audit close

Select **Open the audit trail**. The top events show approval, policy
revalidation and simulator completion. Select **Restart walkthrough** for the
next visitor.

## Recovery

- The restart icon returns immediately to step one.
- Closing the guide removes all temporary completion state.
- **Reset** inside Demo Backstage clears every synthetic input.
- Refresh resets both the built-in replay and Demo Backstage without reading or
  writing persistent data.

## Backstage operator flow

1. Open **Backstage → Farm state** and set a sensor value, status and trend.
2. Optionally set automation to running, paused or emergency stop.
3. Open **AI task**, enter the proposed action and select **Needs approval**.
4. Select **Open AI Decisions**, open the new card, then approve or reject it.
5. Show the card moving to its new lane and the synthetic event appearing in
   **Audit & Outcomes**.

The backstage is presentation scaffolding only. It does not represent a product
admin feature and must not be carried into the production build.
