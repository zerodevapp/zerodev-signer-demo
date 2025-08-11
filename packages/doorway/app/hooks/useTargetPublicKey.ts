"use client";

import { useState, useCallback } from "react";
import { useTurnkey } from "@turnkey/sdk-react";
import { sha256 } from "viem";
import type { Hex } from "viem";

interface UseTargetPublicKeyReturn {
  targetPublicKey: string | null;
  compressedPublicKey: string | null;
  nonce: string | undefined;
  isGenerating: boolean;
  generateNewKey: () => Promise<void>;
  error: string | null;
}


export function useTargetPublicKey(): UseTargetPublicKeyReturn {
  const { indexedDbClient, authIframeClient } = useTurnkey();
  const [targetPublicKey, setTargetPublicKey] = useState<string | null>(null);
  const [compressedPublicKey, setCompressedPublicKey] = useState<string | null>(
    null
  );
  const [nonce, setNonce] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateNewKey = useCallback(async () => {
    if (!indexedDbClient || !authIframeClient) {
      setError("Turnkey clients not initialized");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      await indexedDbClient.init();

      // Get the embedded public key (uncompressed format for email auth)
      const newKey = await authIframeClient.getEmbeddedPublicKey();
      const compressedPublicKey = await indexedDbClient.getPublicKey();
      setCompressedPublicKey(compressedPublicKey);
      // Generate nonce by hashing the public key
      const hashValue = sha256(compressedPublicKey as Hex);
      setNonce(hashValue.replace(/^0x/, ""));

      if (newKey) {
        setTargetPublicKey(newKey);
      } else {
        setError("Failed to generate public key");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setIsGenerating(false);
    }
  }, [authIframeClient, indexedDbClient]);

 

  return {
    targetPublicKey,
    compressedPublicKey,
    nonce,
    isGenerating,
    generateNewKey,
    error,
  };
}
