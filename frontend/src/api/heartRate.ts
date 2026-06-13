import client from './client';
import { Reading, HighEvent, CreateReadingDto } from '../types';

export const getReadings = async (patientId: string): Promise<Reading[]> => {
  const { data } = await client.get<Reading[]>(`/heart-rate/${patientId}`);
  return data;
};

export const getHighEvents = async (patientId?: string): Promise<HighEvent[]> => {
  const url = patientId ? `/heart-rate/high-events/${patientId}` : '/heart-rate/high-events';
  const { data } = await client.get<HighEvent[]>(url);
  return data;
};

export const addReading = async (dto: CreateReadingDto): Promise<Reading> => {
  const { data } = await client.post<Reading>('/heart-rate', dto);
  return data;
};
