import type { Pin } from "../types";
import api from "./api";

export async function fetchPins(): Promise<Pin[]> {
  const { data } = await api.get<Pin[]>("/pins");
  return data;
}

export async function createPin(pin: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  color?: string;
}): Promise<Pin> {
  const { data } = await api.post<Pin>("/pins", pin);
  return data;
}

export async function updatePin(
  id: string,
  updates: Partial<{ name: string; address: string; latitude: number; longitude: number; color: string }>,
): Promise<Pin> {
  const { data } = await api.put<Pin>(`/pins/${id}`, updates);
  return data;
}

export async function deletePin(id: string): Promise<void> {
  await api.delete(`/pins/${id}`);
}
