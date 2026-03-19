export interface User {
  id: string;
  email: string;
}

export interface AmenityItem {
  id: string;
  floorPlanId: string;
  label: string;
  checked: boolean;
  sortOrder: number;
}

export interface Photo {
  id: string;
  floorPlanId: string;
  storageKey: string;
  url: string;
  mimeType: string;
  originalName: string;
  sortOrder: number;
}

export interface FloorPlan {
  id: string;
  pinId: string;
  name: string;
  rent: number | null;
  notes: string;
  sortOrder: number;
  amenities: AmenityItem[];
  photos: Photo[];
}

export interface Pin {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  color: string;
  floorPlans: FloorPlan[];
}
