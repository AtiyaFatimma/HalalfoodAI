
export enum CertificationType {
  CERTIFIED = 'Certified Halal',
  MUSLIM_OWNED = 'Muslim-Owned',
  HALAL_FRIENDLY = 'Halal-Friendly',
  UNKNOWN = 'Verification Needed'
}

export interface Restaurant {
  name: string;
  certification: CertificationType;
  cuisine: string;
  location: string;
  specialties: string[];
  notes?: string;
  uri?: string;
  rating?: number;
}

export interface IngredientAnalysis {
  status: 'Halal' | 'Haram' | 'Mushbooh' | 'Unknown';
  problematicIngredients: string[];
  explanation: string;
  alternatives: string[];
}

export type AppView = 'home' | 'chat' | 'restaurants' | 'scanner' | 'travel';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
