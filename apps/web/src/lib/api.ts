const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api/v1';

type AuthTokenGetter = () => Promise<string | null>;
let authTokenGetter: AuthTokenGetter | null = null;

export function setApiAuthTokenGetter(getter: AuthTokenGetter | null) {
  authTokenGetter = getter;
}

export interface MeetingListItem {
  id: string;
  title: string;
  status: string;
}

export interface MeetingUtterance {
  id: string;
  segmentIndex: number;
  speakerLabel: string | null;
  startMs: number;
  endMs: number;
  text: string;
}

export interface MeetingTranscript {
  id: string;
  provider: string | null;
  language: string | null;
  createdAt: string;
  utterances: MeetingUtterance[];
}

export interface MeetingActionItem {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string | null;
  confidence: number | null;
  humanReviewRequired: boolean;
}

export interface MeetingDetail extends MeetingListItem {
  organizationId: string;
  teamId: string;
  source: string | null;
  scheduledAt: string | null;
  transcripts: MeetingTranscript[];
  actionItems: MeetingActionItem[];
}

export interface TaskListItem {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

export interface DashboardSummary {
  meetingsProcessed: number;
  actionItemsOpen: number;
  actionItemsCompleted: number;
  overdueItems: number;
}

export interface CreateMeetingPayload {
  organizationId: string;
  teamId: string;
  title: string;
  scheduledAt: string;
  source: string;
  participants: string[];
}

export interface ProcessMeetingPayload {
  transcriptText: string;
  idempotencyKey?: string;
}

export interface CreateUploadSessionPayload {
  fileName: string;
  contentType: string;
}

export interface UploadSessionResponse {
  meetingId: string;
  fileName: string;
  contentType: string;
  uploadUrl: string;
  expiresInSeconds: number;
}

export interface TransitionTaskPayload {
  actionItemId: string;
  toStatus: 'todo' | 'in_progress' | 'done';
}

export interface ListTasksParams {
  teamId?: string;
  ownerUserId?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueBefore?: string;
  dueAfter?: string;
  q?: string;
}

const DEV_HEADERS = {
  'x-dev-user-id': process.env.NEXT_PUBLIC_DEV_USER_ID ?? '33333333-3333-4333-8333-333333333331',
  'x-dev-org-id': process.env.NEXT_PUBLIC_DEV_ORG_ID ?? '11111111-1111-4111-8111-111111111111',
  'x-dev-role': process.env.NEXT_PUBLIC_DEV_ROLE ?? 'manager',
  'x-dev-team-id': process.env.NEXT_PUBLIC_DEV_TEAM_ID ?? '22222222-2222-4222-8222-222222222221',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authTokenGetter ? await authTokenGetter() : null;
  const isProduction = process.env.NODE_ENV === 'production';
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!isProduction) {
    for (const [headerName, headerValue] of Object.entries(DEV_HEADERS)) {
      if (!headers.has(headerName)) {
        headers.set(headerName, headerValue);
      }
    }
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  listMeetings: (organizationId: string) => request<MeetingListItem[]>(`/meetings?organizationId=${organizationId}`),
  getMeeting: (meetingId: string) => request<MeetingDetail>(`/meetings/${meetingId}`),
  createMeeting: (payload: CreateMeetingPayload) =>
    request<MeetingListItem>('/meetings', { method: 'POST', body: JSON.stringify(payload) }),
  processMeeting: (meetingId: string, payload: ProcessMeetingPayload) =>
    request<{ runId: string; idempotencyKey: string; extractionResultId: string; createdTaskIds: string[] }>(
      `/ai/process/meeting/${meetingId}`,
      { method: 'POST', body: JSON.stringify(payload) },
    ),
  createUploadSession: (meetingId: string, payload: CreateUploadSessionPayload) =>
    request<UploadSessionResponse>(`/meetings/${meetingId}/upload-session`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  listTasks: (params?: ListTasksParams) => {
    const query = new URLSearchParams();
    if (params?.teamId) query.set('teamId', params.teamId);
    if (params?.ownerUserId) query.set('ownerUserId', params.ownerUserId);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.dueBefore) query.set('dueBefore', params.dueBefore);
    if (params?.dueAfter) query.set('dueAfter', params.dueAfter);
    if (params?.q) query.set('q', params.q);
    const suffix = query.toString() ? `?${query.toString()}` : '';
    return request<TaskListItem[]>(`/tasks${suffix}`);
  },
  transitionTask: (taskId: string, payload: TransitionTaskPayload) =>
    request<TaskListItem>(`/tasks/${taskId}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  dashboardSummary: (organizationId: string) =>
    request<DashboardSummary>(`/dashboard/summary?organizationId=${organizationId}`),
};
