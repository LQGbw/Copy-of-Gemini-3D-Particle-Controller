export enum GestureType {
  None = 'NONE',
  OpenPalm = 'OPEN_PALM',
  ClosedFist = 'CLOSED_FIST',
  Pointing = 'POINTING',
  Victory = 'VICTORY' // Peace sign
}

export interface ParticleState {
  gesture: GestureType;
  confidence: number;
  lastUpdate: number;
}

export interface AnalysisResult {
  gesture: GestureType;
  description: string;
}