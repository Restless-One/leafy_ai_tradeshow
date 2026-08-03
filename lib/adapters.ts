import { DEMO_SNAPSHOT } from "./demo-data";
import type {
  AIRecommendation,
  ExecutionResult,
  ImageObservation,
  ProposedAction,
  SensorReading,
} from "./domain";
import { canExecuteAction } from "./safety-policy";

export interface FarmAdapter {
  readSensors(): Promise<SensorReading[]>;
  readImages(): Promise<ImageObservation[]>;
}

export interface RecommendationAdapter {
  createRecommendation(input: {
    sensors: SensorReading[];
    observations: ImageObservation[];
  }): Promise<AIRecommendation>;
}

export interface ActuatorAdapter {
  readonly name: string;
  execute(action: ProposedAction): Promise<ExecutionResult>;
}

export class DemoFarmAdapter implements FarmAdapter {
  async readSensors(): Promise<SensorReading[]> {
    return structuredClone(DEMO_SNAPSHOT.sensors);
  }

  async readImages(): Promise<ImageObservation[]> {
    return structuredClone(DEMO_SNAPSHOT.observations);
  }
}

export class DemoRecommendationAdapter implements RecommendationAdapter {
  async createRecommendation(): Promise<AIRecommendation> {
    return structuredClone(DEMO_SNAPSHOT.recommendations[0]);
  }
}

export class FarmSimulatorAdapter implements ActuatorAdapter {
  readonly name = "farm-simulator";

  async execute(action: ProposedAction): Promise<ExecutionResult> {
    const createdAt = new Date().toISOString();
    if (!canExecuteAction(action)) {
      return {
        id: `execution-${crypto.randomUUID()}`,
        actionId: action.id,
        adapter: this.name,
        outcome: "blocked",
        detail: "The policy or approval state did not permit simulator execution.",
        createdAt,
      };
    }
    return {
      id: `execution-${crypto.randomUUID()}`,
      actionId: action.id,
      adapter: this.name,
      outcome: "completed",
      detail: "Simulation completed; no physical hardware command was sent.",
      createdAt,
    };
  }
}
