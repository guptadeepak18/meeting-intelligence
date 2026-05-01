import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Meeting Intelligence',
  description: 'Batch-first meeting intelligence MVP scaffold',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.9rem' }}>
          Made with ❤️ at HyperBuild
        </footer>
      </body>
    </html>
  );
}
