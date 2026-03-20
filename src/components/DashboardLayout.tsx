"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSpotify } from "@/context/SpotifyContext";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/library", label: "Library" },
  { href: "/dashboard/playlists", label: "Playlists" },
  { href: "/dashboard/discover", label: "Discover" },
];

export default function DashboardLayout({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { display_name: string | null; images: { url: string }[]; external_urls: { spotify: string } };
}) {
  const pathname = usePathname();
  const { logout } = useSpotify();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="text-xl font-bold text-white">
            Boberwrapped
          </Link>
          <nav className="flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  pathname === item.href
                    ? "text-[#1db954]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href={user.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
            >
              {user.images[0] && (
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={user.images[0].url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span>{user.display_name || "User"}</span>
            </a>
            <button
              onClick={logout}
              className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
