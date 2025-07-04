import { Turnkey } from '@turnkey/sdk-server';
import { DEFAULT_ETHEREUM_ACCOUNTS } from '@turnkey/sdk-browser';

const turnkeyServer = new Turnkey({
  apiBaseUrl: 'https://api.turnkey.com',
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID!,
}).apiClient();

type Attestation = {
  credentialId: string;
  clientDataJson: string;
  attestationObject: string;
  transports: (
    | 'AUTHENTICATOR_TRANSPORT_BLE'
    | 'AUTHENTICATOR_TRANSPORT_INTERNAL'
    | 'AUTHENTICATOR_TRANSPORT_NFC'
    | 'AUTHENTICATOR_TRANSPORT_USB'
    | 'AUTHENTICATOR_TRANSPORT_HYBRID'
  )[];
};

type RequestBody = {
  email: string;
  encodedChallenge: string;
  attestation: Attestation;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const response = await turnkeyServer.createSubOrganization({
      subOrganizationName: `${body.email}'s suborg`,
      rootUsers: [
        {
          userName: body.email,
          userEmail: body.email,
          apiKeys: [],
          authenticators: [
            {
              authenticatorName: 'Default Passkey',
              challenge: body.encodedChallenge,
              attestation: body.attestation,
            },
          ],
          oauthProviders: [],
        },
      ],
      rootQuorumThreshold: 1,
      wallet: {
        walletName: 'Default Wallet',
        accounts: DEFAULT_ETHEREUM_ACCOUNTS,
      },
    });

    return Response.json(response, { status: 201 });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error';

    return Response.json({ message }, { status: 500 });
  }
}
