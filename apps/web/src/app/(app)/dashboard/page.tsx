'use client';

import { useEffect, useState } from 'react';
import { apiClient, type DashboardSummary } from '../../../lib/api';

const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEV_ORG_ID ?? '11111111-1111-4111-8111-111111111111';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const data = await apiClient.dashboardSummary(DEFAULT_ORG_ID);
        setSummary(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      }
    };

    void run();
  }, []);

  return (
    <main>
      <h2>Dashboard</h2>
      <p>Scoped analytics from persisted meeting and task data.</p>

      {error ? <p style={{ color: '#9f2a2a' }}>{error}</p> : null}

      <section style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <article className="card">
          <h3>Meetings Processed</h3>
          <p>{summary?.meetingsProcessed ?? '-'}</p>
        </article>
        <article className="card">
          <h3>Open Actions</h3>
          <p>{summary?.actionItemsOpen ?? '-'}</p>
        </article>
        <article className="card">
          <h3>Completed Actions</h3>
          <p>{summary?.actionItemsCompleted ?? '-'}</p>
        </article>
        <article className="card">
          <h3>Overdue</h3>
          <p>{summary?.overdueItems ?? '-'}</p>
        </article>
      </section>
    </main>
  );
}
