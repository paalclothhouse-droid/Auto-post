
export enum TaskStatus {
  IDLE = 'IDLE',
  FETCHING = 'FETCHING',
  REWRITING = 'REWRITING',
  POSTING = 'POSTING',
  COOLDOWN = 'COOLDOWN',
  WAITING_FOR_SCHEDULE = 'WAITING_FOR_SCHEDULE',
  ERROR = 'ERROR'
}

export interface ContentLog {
  id: string;
  timestamp: string;
  platform: string;
  originalUrl: string;
  newCaption: string;
  status: 'Success' | 'Pending' | 'Failed';
}

export interface AutomationSettings {
  instagramUsername: string;
  customPrompt: string;
  scheduleHours: number[]; // e.g., [6, 9, 12]
  platforms: {
    tiktok: boolean;
    youtube: boolean;
    facebook: boolean;
    threads: boolean;
  };
}
