import client from './client';
import { Patient } from '../types';

export const getPatients = async (): Promise<Patient[]> => {
  const { data } = await client.get<Patient[]>('/patients');
  return data;
};

export const getPatient = async (id: string): Promise<Patient> => {
  const { data } = await client.get<Patient>(`/patients/${id}`);
  return data;
};
