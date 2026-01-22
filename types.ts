
export enum UrgencyLevel {
  L1 = 1,
  L2 = 2,
  L3 = 3,
  L4 = 4,
  L5 = 5
}

export enum ImportanceLevel {
  L1 = 1,
  L2 = 2,
  L3 = 3,
  L4 = 4,
  L5 = 5
}

export enum TimeSavingPotential {
  VERY_MUCH = 'very much',
  NOT_MUCH = 'not much',
  MAY_NOT_SAVE = 'may not save'
}

export interface EstimatedTime {
  days: number;
  hours: number;
  minutes: number;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  deadline: string;
  probableCompletion: string;
  estimatedTime: EstimatedTime;
  urgency: UrgencyLevel;
  importance: ImportanceLevel;
  timeSaving: TimeSavingPotential;
  isSerious: boolean;
  actualTimeTaken?: number;
  completedAt?: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface Vision {
  id: string;
  text: string;
  timeline: string;
}

export interface Goal {
  id: string;
  title: string;
  timeline: string;
  plans: string[];
}

export interface PersonalSubItem {
  id: string;
  heading: string;
  value: string;
}

export interface PersonalItem {
  id: string;
  name: string;
  subItems: PersonalSubItem[];
}

export interface PersonalCategory {
  id: string;
  name: string;
  items: PersonalItem[];
}

export interface GitHubConfig {
  token: string;
  repo: string;
  path: string;
  owner: string;
}

export interface AppData {
  tasks: Task[];
  visions: Vision[];
  goals: Goal[];
  personalCategories: PersonalCategory[];
  lastSync?: string;
}
