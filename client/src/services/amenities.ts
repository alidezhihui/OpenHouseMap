import type { AmenityItem } from "../types";
import api from "./api";

export async function createAmenity(
  floorPlanId: string,
  data: { label: string; checked?: boolean },
): Promise<AmenityItem> {
  const { data: amenity } = await api.post<AmenityItem>(
    `/floor-plans/${floorPlanId}/amenities`,
    data,
  );
  return amenity;
}

export async function updateAmenity(
  id: string,
  updates: Partial<{ label: string; checked: boolean }>,
): Promise<AmenityItem> {
  const { data } = await api.put<AmenityItem>(`/amenities/${id}`, updates);
  return data;
}

export async function deleteAmenity(id: string): Promise<void> {
  await api.delete(`/amenities/${id}`);
}
