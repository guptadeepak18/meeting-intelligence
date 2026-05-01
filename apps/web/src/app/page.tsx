import Link from 'next/link';

export default function HomePage() {
  return (
    <main>
      <h1>Meeting Intelligence</h1>
      <p>Production-oriented MVP workflow with authenticated API, batch processing, and live task tracking.</p>
      <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <Link className="card" href="/meetings">
          Meetings
        </Link>
        <Link className="card" href="/tasks">
          Tasks
        </Link>
        <Link className="card" href="/dashboard">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
