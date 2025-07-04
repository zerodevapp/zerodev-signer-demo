'use client';

import { useEffect, useState } from 'react';
import { useTurnkey } from '@turnkey/sdk-react';
import { Session as TurnkeySession } from '@turnkey/sdk-browser';

export function SessionStatus() {
  const { turnkey } = useTurnkey();
  const [session, setSession] = useState<TurnkeySession | undefined>(undefined);

  useEffect(() => {
    async function updateSession() {
      if (turnkey) {
        setSession(await turnkey.getSession());
      }
    }

    updateSession();
  }, [turnkey]);

  async function logout() {
    await turnkey.logout();
    const turnkeySession = await turnkey.getSession();

    setSession(turnkeySession);
  }

  if (typeof session === 'undefined') {
    return (
      <div className="flex flex-col gap-2 border-2 rounded-md p-2 w-full">
        <div className="flex flex-col">
          <span>
            <b>Session:</b> No
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 border-2 rounded-md p-2">
      <div className="flex flex-col">
        <span>
          <b>Session:</b> Yes
        </span>
        <span>
          <b>Session Type:</b> {session.sessionType}
        </span>
        <span>
          <b>Session Expiry:</b> {new Date(session.expiry).toLocaleString()}
        </span>
      </div>
      <button
        onClick={logout}
        className="bg-black text-white rounded-md cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
}
