'use client';

import { useEffect, useState } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';
import { Session as TurnkeySession } from '@turnkey/sdk-browser';

export function SessionStatus() {
  const { turnkey } = useTurnkey();
  const [session, setSession] = useState<TurnkeySession | undefined>(undefined);
  const [isHovered, setIsHovered] = useState(false);

  const hasSession = typeof session !== 'undefined';

  useEffect(() => {
    async function updateSession() {
      if (turnkey) {
        setSession(await turnkey.getSession());
      }
    }

    updateSession();
  }, [turnkey]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
            hasSession
              ? 'text-green-600 border-green-600'
              : 'text-red-600 border-red-600'
          }`}
        >
          {hasSession ? '✓' : '✗'}
        </button>

        {isHovered && (
          <div
            className={`absolute bottom-14 right-0 bg-white border-2 rounded-lg p-4 min-w-96 z-50 ${
              hasSession ? 'border-green-600' : 'border-red-600'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <span>
                  <b>Session:</b> {hasSession ? 'Yes' : 'No'}
                </span>
                {hasSession && (
                  <>
                    <span>
                      <b>Session Type:</b> {session.sessionType}
                    </span>
                    <span>
                      <b>Session Expiry:</b>{' '}
                      {new Date(session.expiry).toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
