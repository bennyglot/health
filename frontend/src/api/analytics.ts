import client from './client';
import { Analytics } from '../types';

export const getAnalytics = async (
  patientId: string,
  startDate?: string,
  endDate?: string,
): Promise<Analytics> => {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const { data } = await client.get<Analytics>(`/analytics/${patientId}`, { params });
  return data;
};
