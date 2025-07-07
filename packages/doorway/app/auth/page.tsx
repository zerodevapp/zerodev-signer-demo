'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTurnkey } from '@turnkey/sdk-react';

type TSubOrgFormData = {
  email: string;
  targetPublicKey: string;
};

type ResponseBody = {
  subOrganizationId: string;
  wallet: { addresses: string[] };
};

type Status = 'idle' | 'in_progress' | 'success' | 'error';

export default function CreateSubOrganization() {
  const { authIframeClient } = useTurnkey();
  const [status, setStatus] = useState<Status>('idle');

  const { register: subOrgFormRegister, handleSubmit: subOrgFormSubmit } =
    useForm<TSubOrgFormData>();

  const [createSubOrganizationResponse, setCreateSubOrganizationResponse] =
    useState<ResponseBody | null>(null);

  const createSubOrg = async (data: TSubOrgFormData) => {
    try {
      setStatus('in_progress');

      const response = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          targetPublicKey: await authIframeClient.getEmbeddedPublicKey(),
        }),
      });

      setCreateSubOrganizationResponse(await response.json());
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Welcome to Doorway
      </h1>
      {status === 'idle' && (
        <form
          onSubmit={subOrgFormSubmit(createSubOrg)}
          className="flex flex-col gap-6 p-6 bg-white rounded-lg shadow-md max-w-md w-full"
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              {...subOrgFormRegister('email')}
              placeholder="Enter your email"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue
          </button>
        </form>
      )}
      {status === 'in_progress' && <div>Loading...</div>}
      {status === 'error' && <div>There was an error.</div>}
      {status === 'success' && (
        <div className="text-center flex flex-col">
          <span>
            <b>Sub-organization id:</b>{' '}
            {createSubOrganizationResponse.subOrganizationId}
          </span>
          <span>
            <b>Wallet:</b> {createSubOrganizationResponse.wallet.addresses[0]}
          </span>
        </div>
      )}
    </div>
  );
}
