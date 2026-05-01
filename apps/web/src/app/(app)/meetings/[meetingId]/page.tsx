'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient, type MeetingDetail } from '../../../../lib/api';

function formatTimeRange(startMs: number, endMs: number): string {
  const start = Math.floor(startMs / 1000);
  const end = Math.floor(endMs / 1000);
  return `${start}s - ${end}s`;
}

export default function MeetingDetailPage() {
  const params = useParams<{ meetingId: string }>();
  const meetingId = params.meetingId;
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!meetingId) {
        return;
      }

      try {
        setError(null);
        const data = await apiClient.getMeeting(meetingId);
        setMeeting(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meeting details');
      }
    };

    void run();
  }, [meetingId]);

  const latestTranscript = useMemo(() => meeting?.transcripts[0] ?? null, [meeting]);

  return (
    <main>
      <p>
        <Link href="/meetings">Back to meetings</Link>
      </p>
      <h2>{meeting?.title ?? 'Meeting detail'}</h2>
      <p>
        Status: <strong>{meeting?.status ?? '-'}</strong>
      </p>

      {error ? <p style={{ color: '#9f2a2a' }}>{error}</p> : null}

      <section className="card" style={{ marginTop: '1rem' }}>
        <h3>Transcript (Latest)</h3>
        {!latestTranscript ? <p>No transcript is available yet.</p> : null}
        {latestTranscript?.utterances.length ? (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {latestTranscript.utterances.map((utterance) => (
              <article
                key={utterance.id}
                style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '0.5rem 0.75rem' }}
              >
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>
                  {(utterance.speakerLabel ?? 'Unknown speaker') + ' · ' + formatTimeRange(utterance.startMs, utterance.endMs)}
                </p>
                <p style={{ margin: '0.35rem 0 0' }}>{utterance.text}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="card" style={{ marginTop: '1rem' }}>
        <h3>Extracted Action Items</h3>
        {!meeting?.actionItems.length ? <p>No action items found for this meeting yet.</p> : null}
        {meeting?.actionItems.length ? (
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {meeting.actionItems.map((item) => (
              <article
                key={item.id}
                style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '0.5rem 0.75rem' }}
              >
                <p style={{ margin: 0 }}>
                  <strong>{item.title}</strong>
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.92rem' }}>
                  {`Status: ${item.status} · Priority: ${item.priority} · Confidence: ${item.confidence ?? '-'}${
                    item.humanReviewRequired ? ' · Human review required' : ''
                  }`}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      {meetingId ? (
        <p style={{ marginTop: '1rem', opacity: 0.7, fontSize: '0.9rem' }}>Meeting ID: {meetingId}</p>
      ) : null}
    </main>
  );
}
