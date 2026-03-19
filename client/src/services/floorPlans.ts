import type { FloorPlan } from "../types";
import api from "./api";

export async function createFloorPlan(
  pinId: string,
  data?: { name?: string; rent?: number | null; notes?: string },
): Promise<FloorPlan> {
  const { data: floorPlan } = await api.post<FloorPlan>(`/pins/${pinId}/floor-plans`, data ?? {});
  return floorPlan;
}

export async function updateFloorPlan(
  id: string,
  updates: Partial<{ name: string; rent: number | null; notes: string }>,
): Promise<FloorPlan> {
  const { data } = await api.put<FloorPlan>(`/floor-plans/${id}`, updates);
  return data;
}

export async function deleteFloorPlan(id: string): Promise<void> {
  await api.delete(`/floor-plans/${id}`);
}
