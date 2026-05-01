import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { extractionOutputSchema, taskStatusTransitionSchema } from '@meeting-intelligence/shared';
import type { DashboardSummary, MeetingDetail, TaskListItem } from './api';

describe('Web client contract compatibility', () => {
  it('keeps dashboard response shape compatible with UI expectations', () => {
    const payload: DashboardSummary = {
      meetingsProcessed: 12,
      actionItemsOpen: 7,
      actionItemsCompleted: 5,
      overdueItems: 2,
    };

    expect(payload.actionItemsOpen).toBeGreaterThanOrEqual(0);
  });

  it('keeps task status values compatible with shared transition schema', () => {
    const task: TaskListItem = {
      id: '44444444-4444-4444-8444-444444444444',
      title: 'Ship release notes',
      status: 'in_progress',
      priority: 'high',
    };

    const parsed = taskStatusTransitionSchema.parse({
      actionItemId: task.id,
      fromStatus: 'todo',
      toStatus: task.status,
      reason: 'Picked up from board',
    });

    expect(parsed.toStatus).toBe(task.status);
  });

  it('keeps meeting detail action item shape compatible with extraction schema output', () => {
    const detail: MeetingDetail = {
      id: 'meeting-1',
      title: 'Sync',
      status: 'tasks_created',
      organizationId: 'org-1',
      teamId: 'team-1',
      source: 'web',
      scheduledAt: null,
      transcripts: [],
      actionItems: [
        {
          id: 'task-1',
          title: 'Prepare launch notes',
          status: 'todo',
          priority: 'medium',
          dueDate: null,
          confidence: 0.7,
          humanReviewRequired: false,
        },
      ],
    };

    const parsed = extractionOutputSchema.parse({
      actionItems: detail.actionItems.map((item) => ({
        title: item.title,
        ownerCandidate: null,
        dueDate: item.dueDate,
        priority: item.priority,
        confidence: item.confidence ?? 0.5,
        rationale: 'Derived from action item projection',
      })),
    });

    expect(parsed.actionItems.length).toBe(1);
  });
});
