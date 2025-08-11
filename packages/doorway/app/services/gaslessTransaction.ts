import {
  createPublicClient,
  Hex,
  http,
  Address,
  SignedAuthorization,
  parseSignature,
  hashMessage,
} from "viem";
import { getUserOperationGasPrice } from "@zerodev/sdk/actions";
import { sepolia } from "viem/chains";
import { getEntryPoint, KERNEL_V3_3 } from "@zerodev/sdk/constants";
import {
  createKernelAccount,
  createKernelAccountClient,
  createZeroDevPaymasterClient,
} from "@zerodev/sdk";
import { useTurnkey } from "@turnkey/sdk-react";
import { toAccount } from "viem/accounts";
import { hashAuthorization } from "viem/utils";

const entryPoint = getEntryPoint("0.7");
const kernelVersion = KERNEL_V3_3;
const chain = sepolia;

export interface GaslessTransactionParams {
  turnkeyClient: ReturnType<typeof useTurnkey>["client"];
  organizationId: string;
  fromAddress: Address;
  to: Address;
  data: Hex;
  value: bigint;
}

export async function sendGaslessTransaction({
  turnkeyClient,
  organizationId,
  fromAddress,
  to,
  data,
  value,
}: GaslessTransactionParams) {
  const ZERODEV_RPC = process.env.NEXT_PUBLIC_ZERODEV_RPC_URL;

  if (!ZERODEV_RPC) {
    throw new Error("ZERODEV_RPC_URL is not set");
  }

  const publicClient = createPublicClient({
    transport: http(),
    chain,
  });

  if (!turnkeyClient) {
    throw new Error("Turnkey client is not set");
  }

  const eip7702Account = toAccount({
    address: fromAddress,
    signMessage: async (message) => {
      const stampResponse = await turnkeyClient?.stampSignRawPayload({
        // @ts-expect-error: we need parameters in this format
        type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
        organizationId: organizationId,
        timestampMs: Date.now().toString(),
        parameters: {
          signWith: fromAddress!,
          payload: hashMessage(message.message),
          encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
          hashFunction: "HASH_FUNCTION_NO_OP",
        },
      });
      const response = await fetch(
        "http://localhost:3001/api/v1/sign/raw-payload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: stampResponse?.body,
            stamp: stampResponse?.stamp,
            apiUrl: stampResponse?.url,
            operationType: "raw_payload", // Specify that this is raw payload signing
          }),
        }
      );

      const data = await response.json();
      console.log("data", data);

      if (!response.ok) {
        throw new Error(data.error || "Signing failed");
      }

      return data.signature;
    },
    signTransaction: async () => {
      throw new Error("Not implemented");
    },
    signTypedData: async () => {
      throw new Error("Not implemented");
    },
    signAuthorization: async (parameters) => {
      console.log("signAuthorization", parameters);
      const { chainId, nonce } = parameters;
      const address = parameters.contractAddress ?? parameters.address;

      if (!address) {
        throw new Error("Unable to sign authorization: address is undefined.");
      }

      const hashedAuthorization = hashAuthorization({
        address: address,
        chainId,
        nonce,
      });
      console.log("hashedAuthorization", hashedAuthorization);

      const stampResponse = await turnkeyClient?.stampSignRawPayload({
        // @ts-expect-error: we need parameters in this format
        type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
        organizationId: organizationId,
        timestampMs: Date.now().toString(),
        parameters: {
          signWith: fromAddress!,
          payload: hashedAuthorization,
          encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
          hashFunction: "HASH_FUNCTION_NO_OP",
        },
      });
      const response = await fetch(
        "http://localhost:3001/api/v1/sign/raw-payload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: stampResponse?.body,
            stamp: stampResponse?.stamp,
            apiUrl: stampResponse?.url,
            operationType: "raw_payload", // Specify that this is raw payload signing
          }),
        }
      );

      const data = await response.json();
      console.log("data", data);

      if (!response.ok) {
        throw new Error(data.error || "Signing failed");
      }

      const signature = parseSignature(data.signature);

      return {
        address,
        chainId,
        nonce,
        ...signature,
        yParity: signature.v === BigInt(27) ? 0 : 1,
      } as SignedAuthorization;

    },
  });

  // Create the EIP-7702 account using Turnkey as the signer
  // We use the user's sub-organization ID passed from the dashboard
  // const eip7702Account = await createAccount({
  //   client: turnkeyClient,
  //   organizationId: organizationId,
  //   signWith: fromAddress,
  // });

  console.log("EOA Address:", eip7702Account.address);

  // Create a Kernel account with the Turnkey signer
  const account = await createKernelAccount(publicClient, {
    eip7702Account,
    entryPoint,
    kernelVersion,
  });

  console.log("Kernel account address:", account.address);

  // Create paymaster client for gasless transactions
  const paymasterClient = createZeroDevPaymasterClient({
    chain,
    transport: http(ZERODEV_RPC),
  });

  // Create Kernel client
  const kernelClient = createKernelAccountClient({
    account,
    chain,
    bundlerTransport: http(ZERODEV_RPC),
    paymaster: {
      getPaymasterData: async (userOperation) => {
        return paymasterClient.sponsorUserOperation({ userOperation });
      },
    },
    client: publicClient,
    userOperation: {
      estimateFeesPerGas: async ({ bundlerClient }) => {
        return getUserOperationGasPrice(bundlerClient);
      },
    },
  });

  // Send the user operation
  const userOpHash = await kernelClient.sendUserOperation({
    calls: [
      {
        to,
        value,
        data,
      },
    ],
  });

  console.log("UserOp sent:", userOpHash);

  // Wait for the operation to be completed
  const { receipt } = await kernelClient.waitForUserOperationReceipt({
    hash: userOpHash,
  });

  console.log(
    "UserOp completed",
    `${chain.blockExplorers.default.url}/tx/${receipt.transactionHash}`
  );

  return {
    userOpHash,
    transactionHash: receipt.transactionHash,
  };
}
