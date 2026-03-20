import { DASHBOARD_LINK } from "@/lib/constants";

interface ErrorMessageProps {
  message: string;
  hint?: string;
  dashboardLink?: boolean;
  className?: string;
}

export default function ErrorMessage({
  message,
  hint,
  dashboardLink = false,
  className = "",
}: ErrorMessageProps) {
  return (
    <div className={`py-8 text-center ${className}`}>
      <p className="text-amber-400">{message}</p>
      {hint && <p className="mt-2 text-sm text-zinc-500">{hint}</p>}
      {dashboardLink && (
        <p className="mt-2 text-sm text-zinc-500">
          Open your app in the{" "}
          <a
            href={DASHBOARD_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1db954] hover:underline"
          >
            Spotify Developer Dashboard
          </a>{" "}
          and request extended access.
        </p>
      )}
    </div>
  );
}
