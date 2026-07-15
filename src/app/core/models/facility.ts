export enum FacilityStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Maintenance = 'MAINTENANCE',
}

export type FacilityType =
  | 'Warehouse'
  | 'Retail Outlet'
  | 'Distribution Center'
  | 'Office'
  | 'Clinic'
  | string;

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  lastUpdated: string;
  latitude: number;
  longitude: number;
}

export type FacilityUpdate = Pick<
  Facility,
  'id' | 'name' | 'type' | 'status' | 'latitude' | 'longitude'
>;

export const FACILITY_STATUS_OPTIONS: { label: string; value: FacilityStatus }[] = [
  { label: 'Active', value: FacilityStatus.Active },
  { label: 'Inactive', value: FacilityStatus.Inactive },
  { label: 'Maintenance', value: FacilityStatus.Maintenance },
];