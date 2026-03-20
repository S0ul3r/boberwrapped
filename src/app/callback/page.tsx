"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeCodeForToken } from "@/lib/auth";
import { useSpotify } from "@/context/SpotifyContext";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens } = useSpotify();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const codeVerifier = sessionStorage.getItem("spotify_code_verifier");

    if (!code || !codeVerifier) {
      const msg = code
        ? "Session expired. Please try logging in again (use the same URL: 127.0.0.1 or localhost)."
        : "Missing authorization code. Please try logging in again.";
      queueMicrotask(() => setError(msg));
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      queueMicrotask(() => setError("Server configuration error. Please contact support."));
      return;
    }

    exchangeCodeForToken(code, redirectUri, codeVerifier, clientId)
      .then((data) => {
        sessionStorage.removeItem("spotify_code_verifier");
        setTokens(data.access_token, data.refresh_token, data.expires_in);
        router.replace("/dashboard");
      })
      .catch((err) => {
        setError(err.message || "Failed to complete login.");
      });
  }, [searchParams, setTokens, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-8">
        <p className="mb-4 text-red-400">{error}</p>
        <a href="/login" className="text-[#1db954] hover:underline">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1db954] border-t-transparent" />
        <p className="text-zinc-400">Completing login...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#1db954] border-t-transparent" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
