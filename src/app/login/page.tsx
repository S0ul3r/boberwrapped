"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generatePKCE, getLoginUrl } from "@/lib/auth";
import { useSpotify } from "@/context/SpotifyContext";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useSpotify();
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
  const configError = !clientId || !redirectUri ? "missing_credentials" : null;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
      return;
    }
    if (configError) return;

    // Ensure same origin for login and callback - localhost and 127.0.0.1
    // use different sessionStorage, so redirect to match redirectUri's host
    if (typeof window !== "undefined") {
      const redirectHost = new URL(redirectUri!).hostname;
      if (window.location.hostname !== redirectHost) {
        const port = window.location.port || "3000";
        window.location.replace(`http://${redirectHost}:${port}/login`);
        return;
      }
    }

    const initLogin = async () => {
      const { codeVerifier, codeChallenge } = await generatePKCE();
      sessionStorage.setItem("spotify_code_verifier", codeVerifier);
      const url = getLoginUrl(clientId!, redirectUri!, codeChallenge);
      window.location.href = url;
    };

    initLogin();
  }, [isAuthenticated, router, configError, clientId, redirectUri]);

  if (configError === "missing_credentials") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-8">
        <h1 className="mb-6 text-2xl font-bold text-white">Boberwrapped</h1>
        <div className="max-w-md rounded-xl border border-amber-500/50 bg-amber-500/10 p-6 text-left">
          <h2 className="mb-2 font-semibold text-amber-400">
            Missing Spotify credentials
          </h2>
          <p className="mb-4 text-sm text-zinc-300">
            Add <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_SPOTIFY_CLIENT_ID</code> and{" "}
            <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_SPOTIFY_REDIRECT_URI</code> to{" "}
            <code className="rounded bg-zinc-800 px-1">.env.local</code>
          </p>
          <ol className="list-inside list-decimal space-y-1 text-sm text-zinc-400">
            <li>Copy <code className="rounded bg-zinc-800 px-1">.env.example</code> to <code className="rounded bg-zinc-800 px-1">.env.local</code></li>
            <li>Create an app at{" "}
              <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#1db954] hover:underline">
                developer.spotify.com/dashboard
              </a>
            </li>
            <li>Add <code className="rounded bg-zinc-800 px-1">http://localhost:3000/callback</code> to Redirect URIs</li>
            <li>Paste your Client ID into <code className="rounded bg-zinc-800 px-1">.env.local</code></li>
            <li>Restart the dev server (<code className="rounded bg-zinc-800 px-1">npm run dev</code>)</li>
          </ol>
          <Link
            href="/"
            className="mt-4 inline-block text-[#1db954] hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#1db954] border-t-transparent" />
        <p className="text-zinc-400">Redirecting to Spotify...</p>
      </div>
    </div>
  );
}
