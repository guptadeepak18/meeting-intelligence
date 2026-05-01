'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, type MeetingListItem } from '../../../lib/api';

const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEV_ORG_ID ?? '11111111-1111-4111-8111-111111111111';
const DEFAULT_TEAM_ID = process.env.NEXT_PUBLIC_DEV_TEAM_ID ?? '22222222-2222-4222-8222-222222222221';

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<MeetingListItem[]>([]);
  const [title, setTitle] = useState('Weekly Engineering Sync');
  const [transcriptText, setTranscriptText] = useState(
    'Jordan will send release notes by Friday. Avery will validate rollback steps before launch.',
  );
  const [uploadFileName, setUploadFileName] = useState('standup-demo.mp3');
  const [uploadContentType, setUploadContentType] = useState('audio/mpeg');
  const [latestUploadUrl, setLatestUploadUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = async () => {
    try {
      setError(null);
      const data = await apiClient.listMeetings(DEFAULT_ORG_ID);
      setMeetings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings');
    }
  };

  useEffect(() => {
    void loadMeetings();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.createMeeting({
        organizationId: DEFAULT_ORG_ID,
        teamId: DEFAULT_TEAM_ID,
        title,
        scheduledAt: new Date().toISOString(),
        source: 'web',
        participants: ['manager@hyperbuild.dev', 'employee@hyperbuild.dev'],
      });
      await loadMeetings();
      setTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (meetingId: string) => {
    setIsLoading(true);
    try {
      await apiClient.processMeeting(meetingId, {
        transcriptText,
      });
      await loadMeetings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process meeting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUploadSession = async (meetingId: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.createUploadSession(meetingId, {
        fileName: uploadFileName,
        contentType: uploadContentType,
      });
      setLatestUploadUrl(response.uploadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create upload session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <h2>Meetings</h2>
      <p>Batch pipeline: create meeting, process transcript, and generate tasks.</p>

      <form className="card" onSubmit={handleCreate} style={{ display: 'grid', gap: '0.75rem' }}>
        <label>
          Meeting title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
        <button disabled={isLoading} type="submit" style={{ width: 'fit-content' }}>
          {isLoading ? 'Working...' : 'Create Meeting'}
        </button>
      </form>

      <section className="card" style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        <label>
          Transcript seed for processing
          <textarea
            value={transcriptText}
            onChange={(event) => setTranscriptText(event.target.value)}
            rows={4}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
      </section>

      <section className="card" style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>Upload Session</h3>
        <label>
          File name
          <input
            value={uploadFileName}
            onChange={(event) => setUploadFileName(event.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
        <label>
          Content type
          <input
            value={uploadContentType}
            onChange={(event) => setUploadContentType(event.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
          />
        </label>
        {latestUploadUrl ? (
          <p style={{ margin: 0 }}>
            Latest upload URL: <a href={latestUploadUrl}>{latestUploadUrl}</a>
          </p>
        ) : null}
      </section>

      {error ? <p style={{ color: '#9f2a2a' }}>{error}</p> : null}

      <section style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        {meetings.map((meeting) => (
          <article className="card" key={meeting.id}>
            <h3 style={{ marginTop: 0 }}>{meeting.title}</h3>
            <p>
              Status: <strong>{meeting.status}</strong>
            </p>
            <p>
              <Link href={`/meetings/${meeting.id}`}>Open details</Link>
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button disabled={isLoading} onClick={() => void handleCreateUploadSession(meeting.id)} type="button">
                Create Upload Session
              </button>
              <button disabled={isLoading} onClick={() => void handleProcess(meeting.id)} type="button">
                Process Meeting
              </button>
            </div>
            <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>
              Timeline: uploaded {'->'} processing_transcription {'->'} transcribed {'->'} tasks_created
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
