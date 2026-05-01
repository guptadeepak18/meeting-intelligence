import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { ApiAuthBridge } from './api-auth-bridge';
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
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body>
        {clerkPublishableKey ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>
            <ApiAuthBridge />
            {children}
            <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.9rem' }}>
              Made with ❤️ at HyperBuild
            </footer>
          </ClerkProvider>
        ) : (
          <>
            {children}
            <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: '0.9rem' }}>
              Made with ❤️ at HyperBuild
            </footer>
          </>
        )}
      </body>
    </html>
  );
}
