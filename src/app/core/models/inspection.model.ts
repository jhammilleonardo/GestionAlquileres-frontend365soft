export enum InspectionType {
  MOVE_IN = 'move_in',
  MOVE_OUT = 'move_out',
  PERIODIC = 'periodic',
}

export enum InspectionArea {
  LIVING_ROOM = 'living_room',
  KITCHEN = 'kitchen',
  BATHROOM = 'bathroom',
  BEDROOM = 'bedroom',
  EXTERIOR = 'exterior',
  OTHER = 'other',
}

export enum ItemCondition {
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  DAMAGED = 'damaged',
}

export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface InspectionItem {
  id?: number;
  area: InspectionArea;
  item_name: string;
  condition: ItemCondition;
  notes?: string | null;
  photos?: string[];
}

export interface Inspection {
  id: number;
  property_id: number;
  property_title?: string;
  unit_id?: number | null;
  unit_number?: string | null;
  contract_id?: number | null;
  type: InspectionType;
  status: InspectionStatus;
  scheduled_date: string;
  completed_date?: string | null;
  inspector_user_id?: number | null;
  inspector_name?: string | null;
  notes?: string | null;
  items?: InspectionItem[];
}

export interface CreateInspectionDto {
  property_id: number;
  unit_id?: number;
  type: InspectionType;
  scheduled_date: string;
  inspector_user_id?: number;
  notes?: string;
  items?: Array<Pick<InspectionItem, 'area' | 'item_name' | 'condition' | 'notes'>>;
}

export interface InspectionComparisonItem {
  area: InspectionArea;
  item_name: string;
  move_in_condition: ItemCondition;
  move_out_condition: ItemCondition | null;
  changed: boolean;
  move_in_photos: string[];
  move_out_photos: string[];
}

/** Checklist por defecto al crear una inspección (áreas agrupadas con ítems base). */
export const DEFAULT_CHECKLIST: Array<{ area: InspectionArea; items: string[] }> = [
  {
    area: InspectionArea.LIVING_ROOM,
    items: ['Paredes', 'Piso', 'Techo', 'Ventanas', 'Iluminación'],
  },
  {
    area: InspectionArea.KITCHEN,
    items: ['Mesón', 'Fregadero', 'Gabinetes', 'Electrodomésticos', 'Pisos'],
  },
  {
    area: InspectionArea.BATHROOM,
    items: ['Inodoro', 'Lavamanos', 'Ducha', 'Grifería', 'Azulejos'],
  },
  { area: InspectionArea.BEDROOM, items: ['Paredes', 'Piso', 'Closet', 'Ventanas'] },
  { area: InspectionArea.EXTERIOR, items: ['Fachada', 'Jardín', 'Estacionamiento'] },
];
