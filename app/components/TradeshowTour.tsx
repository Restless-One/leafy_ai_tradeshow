"use client";

import {
  Bot,
  Check,
  ChevronRight,
  FileClock,
  Play,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";

export type TradeshowStep = 0 | 1 | 2 | 3 | 4 | 5;

type TourStep = {
  eyebrow: string;
  title: string;
  copy: string;
  action: string;
  icon: LucideIcon;
};

const STEPS: TourStep[] = [
  {
    eyebrow: "TRUSTED FARM STATE",
    title: "Read the farm in one glance.",
    copy: "Sensors, canopy replay and service health reconcile into one explainable snapshot before any action is considered.",
    action: "Inspect visual evidence",
    icon: Sparkles,
  },
  {
    eyebrow: "EVIDENCE LAYER",
    title: "See where the signal came from.",
    copy: "Three replay views turn canopy observations into structured evidence with confidence and image-quality gates.",
    action: "Follow the AI proposal",
    icon: ScanLine,
  },
  {
    eyebrow: "EXPLAINABLE AI",
    title: "The model proposes. Policy decides.",
    copy: "The AI suggests a typed nutrient dose, while the deterministic policy correctly reclassifies it as high risk.",
    action: "Open the decision",
    icon: Bot,
  },
  {
    eyebrow: "HUMAN CONTROL POINT",
    title: "Make the accountable decision.",
    copy: "Approve the simulated action after reviewing evidence, policy reasons and the complete decision lifecycle.",
    action: "Approve & simulate",
    icon: UserRound,
  },
  {
    eyebrow: "SAFETY BOUNDARY",
    title: "Verify where automation stops.",
    copy: "The decision is revalidated, physical control remains disabled and the approved command reaches only the farm simulator.",
    action: "Open the audit trail",
    icon: ShieldCheck,
  },
  {
    eyebrow: "TRACEABLE OUTCOME",
    title: "Close the loop with evidence.",
    copy: "Approval, policy validation and simulator completion now appear as attributable events without changing stored demo data.",
    action: "Restart walkthrough",
    icon: FileClock,
  },
];

export function TradeshowTour({
  active,
  step,
  onStart,
  onNext,
  onExit,
  onRestart,
}: {
  active: boolean;
  step: TradeshowStep;
  onStart: () => void;
  onNext: () => void;
  onExit: () => void;
  onRestart: () => void;
}) {
  if (!active) {
    return (
      <button className="tradeshow-launcher" type="button" onClick={onStart} aria-label="Start the three minute guided demo">
        <span><Play size={17} fill="currentColor" /></span>
        <span><strong>Start guided demo</strong><small>3 minute safe replay</small></span>
        <ChevronRight size={17} />
      </button>
    );
  }

  const current = STEPS[step];
  const StepIcon = current.icon;
  const finalStep = step === STEPS.length - 1;

  return (
    <aside className="tradeshow-guide" aria-label="Tradeshow guided demo">
      <div className="tradeshow-guide-head">
        <span className="tradeshow-live"><i /> LIVE DEMO</span>
        <span>{step + 1} of {STEPS.length}</span>
        <div>
          <button type="button" onClick={onRestart} aria-label="Restart guided demo"><RotateCcw size={15} /></button>
          <button type="button" onClick={onExit} aria-label="Exit guided demo"><X size={16} /></button>
        </div>
      </div>

      <div className="tradeshow-progress" role="progressbar" aria-label="Guided demo progress" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
        <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className="tradeshow-guide-body" aria-live="polite">
        <span className="tradeshow-step-icon"><StepIcon size={22} /></span>
        <span className="eyebrow">{current.eyebrow}</span>
        <h2>{current.title}</h2>
        <p>{current.copy}</p>
      </div>

      <div className="tradeshow-guide-foot">
        <span className="tradeshow-safe"><Check size={13} /> No data writes · no hardware</span>
        <button className="tradeshow-next" type="button" onClick={finalStep ? onRestart : onNext}>
          {current.action}<ChevronRight size={16} />
        </button>
      </div>
    </aside>
  );
}
