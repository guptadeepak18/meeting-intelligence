'use client';

import { useEffect, useState } from 'react';
import { apiClient, type TaskListItem } from '../../../lib/api';

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'critical'>('all');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadTasks = async () => {
    try {
      setError(null);
      const data = await apiClient.listTasks({
        q: query || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
      });
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
  };

  useEffect(() => {
    void loadTasks();
  }, [query, statusFilter, priorityFilter]);

  const updateStatus = async (taskId: string, toStatus: 'todo' | 'in_progress' | 'done') => {
    const previous = tasks;
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: toStatus } : task)));
    setIsLoading(true);
    try {
      await apiClient.transitionTask(taskId, { actionItemId: taskId, toStatus });
      await loadTasks();
    } catch (err) {
      setTasks(previous);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <h2>Tasks</h2>
      <p>Live board with status transitions and server reconciliation.</p>

      <section className="card" style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or rationale"
            style={{ width: '100%', padding: '0.45rem', marginTop: '0.25rem' }}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | 'todo' | 'in_progress' | 'done')}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label>
            Priority
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as 'all' | 'low' | 'medium' | 'high' | 'critical')}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
      </section>

      {error ? <p style={{ color: '#9f2a2a' }}>{error}</p> : null}

      <section style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        {tasks.map((task) => (
          <article className="card" key={task.id}>
            <h3 style={{ marginTop: 0 }}>{task.title}</h3>
            <p>
              Status: <strong>{task.status}</strong>
            </p>
            <p>
              Priority: <strong>{task.priority}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button disabled={isLoading} onClick={() => void updateStatus(task.id, 'todo')} type="button">
                To Do
              </button>
              <button
                disabled={isLoading}
                onClick={() => void updateStatus(task.id, 'in_progress')}
                type="button"
              >
                In Progress
              </button>
              <button disabled={isLoading} onClick={() => void updateStatus(task.id, 'done')} type="button">
                Done
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
