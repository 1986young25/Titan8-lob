export interface OctaLobe {
  id: number;
  name: string;
  tag: string;
  desc: string;
  role: string;
  frequencyHz: number;
  status: 'ONLINE' | 'THROTTLED' | 'ATTENUATING' | 'CIRCUIT_TRIPPED' | 'STANDBY';
  subroutine: string;
  notes?: string;
  pos: [number, number, number];
  scale: number;
  colorHex: number;
  vehicle?: string;
}

export interface TelemetryEvent {
  id?: string;
  timestamp: string;
  source: string;
  type: 'BOOT' | 'PULSE' | 'QASM' | 'ATRM' | 'SEAL' | 'TRIPWIRE' | 'HEAL' | 'TICK' | 'DIRECTIVE';
  message: string;
  entropy?: number;
  attenuationDb?: number;
  sealHash?: string;
  operatorUid: string;
  operatorName?: string;
}

export interface SystemState {
  id: string;
  status: string;
  atomicRoot: string;
  metronomeHz: number;
  freeSpaceZ0: number;
  entropyH: number;
  atrmDb: number;
  manifoldM: number;
  collateralParity: string;
  powSieveOps: number;
  updatedAt: string;
  lastOperatorUid?: string;
}
