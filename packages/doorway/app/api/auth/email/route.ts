import { Turnkey } from '@turnkey/sdk-server';

import { getUserByEmail } from '../../_services/users';

const turnkeyServer = new Turnkey({
  apiBaseUrl: 'https://api.turnkey.com',
  apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY!,
  apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY!,
  defaultOrganizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID!,
}).apiClient();

type RequestBody = {
  email: string;
  organizationId: string;
  targetPublicKey: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const user = await getUserByEmail(body.email);

    const response = await turnkeyServer.emailAuth({
      email: body.email,
      targetPublicKey: body.targetPublicKey,
      timestampMs: String(Date.now()),
      organizationId: user.subOrganizationId,
      emailCustomization: {
        magicLinkTemplate: 'http://localhost:3000/auth/verify?bundle=%s',
      },
    });

    console.log(response);

    return Response.json(response, { status: 200 });
  } catch (reason) {
    const message =
      reason instanceof Error ? reason.message : 'Unexpected error';
    console.error(message);
    return Response.json({ message }, { status: 500 });
  }
}
