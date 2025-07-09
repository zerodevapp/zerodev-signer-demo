import { Turnkey } from '@turnkey/sdk-server';
import { DEFAULT_ETHEREUM_ACCOUNTS } from '@turnkey/sdk-browser';

import { storeUser } from '../_services/users';

const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

const turnkeyServer = new Turnkey({
  apiBaseUrl: 'https://api.turnkey.com',
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID!,
}).apiClient();

type RequestBody = {
  email: string;
  targetPublicKey: string;
};

type Response = {
  email: string;
  subOrganizationId: string;
  wallet: { addresses: string[] };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const createSubOrgResponse = await turnkeyServer.createSubOrganization({
      subOrganizationName: body.email,
      rootUsers: [
        {
          userName: body.email,
          userEmail: body.email,
          apiKeys: [],
          authenticators: [],
          oauthProviders: [],
        },
      ],
      rootQuorumThreshold: 1,
      wallet: {
        walletName: 'Default Wallet',
        accounts: DEFAULT_ETHEREUM_ACCOUNTS,
      },
    });

    console.log(createSubOrgResponse);

    const { subOrganizationId, wallet } = createSubOrgResponse;

    await storeUser({ email: body.email, subOrganizationId });

    const emailAuthResponse = await fetch(`${appUrl}/api/auth/email`, {
      method: 'POST',
      body: JSON.stringify({
        email: body.email,
        organizationId: subOrganizationId,
        targetPublicKey: body.targetPublicKey,
      }),
    });

    console.log(emailAuthResponse);

    const response: Response = {
      email: body.email,
      subOrganizationId,
      wallet,
    };

    return Response.json(response, { status: 201 });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error';
    console.error(message);
    return Response.json({ message }, { status: 500 });
  }
}
