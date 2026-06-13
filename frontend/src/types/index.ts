export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  createdAt: string;
  requestCount: number;
}

export interface Reading {
  id: string;
  patientId: string;
  heartRate: number;
  timestamp: string;
}

export interface HighEvent {
  id: string;
  patientId: string;
  heartRate: number;
  timestamp: string;
}

export interface Analytics {
  patientId: string;
  avg: number;
  max: number;
  min: number;
  readingCount: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateReadingDto {
  patientId: string;
  heartRate: number;
  timestamp: string;
}
