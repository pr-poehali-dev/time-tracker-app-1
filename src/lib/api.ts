const API_BASE = {
  auth: 'https://functions.poehali.dev/fcbbfed4-9a48-4fda-bc1b-0bd4f74c07f4',
  timeEntries: 'https://functions.poehali.dev/51ec0fe9-8ced-46f0-9693-0efe4d57a151',
  projects: 'https://functions.poehali.dev/69ec3dcc-ad21-4043-9c9c-91530ca082ed',
};

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'employee' | 'admin';
}

export interface TimeEntry {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  project_id: number;
  project_name: string;
  activity_id: number;
  activity_name: string;
  entry_date: string;
  hours: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface Activity {
  id: number;
  name: string;
}

export const api = {
  async login(email: string, password: string): Promise<User> {
    const response = await fetch(API_BASE.auth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data.user;
  },

  async getTimeEntries(userId: number): Promise<TimeEntry[]> {
    const response = await fetch(API_BASE.timeEntries, {
      headers: {
        'X-User-Id': userId.toString(),
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch entries');
    }

    return data.entries;
  },

  async createTimeEntry(
    userId: number,
    projectId: number,
    activityId: number,
    date: string,
    hours: number,
    comment: string
  ): Promise<number> {
    const response = await fetch(API_BASE.timeEntries, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString(),
      },
      body: JSON.stringify({
        project_id: projectId,
        activity_id: activityId,
        entry_date: date,
        hours,
        comment,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create entry');
    }

    return data.id;
  },

  async updateTimeEntry(
    userId: number,
    entryId: number,
    projectId: number,
    activityId: number,
    date: string,
    hours: number,
    comment: string
  ): Promise<void> {
    const response = await fetch(API_BASE.timeEntries, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId.toString(),
      },
      body: JSON.stringify({
        id: entryId,
        project_id: projectId,
        activity_id: activityId,
        entry_date: date,
        hours,
        comment,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update entry');
    }
  },

  async deleteTimeEntry(userId: number, entryId: number): Promise<void> {
    const response = await fetch(`${API_BASE.timeEntries}?id=${entryId}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId.toString(),
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete entry');
    }
  },

  async getProjectsAndActivities(): Promise<{ projects: Project[]; activities: Activity[] }> {
    const response = await fetch(API_BASE.projects);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch projects');
    }

    return data;
  },
};
