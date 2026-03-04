import { cn } from "@/lib/utils";

type GovtMonogramProps = {
  className?: string;
  title?: string;
};

export function GovtMonogram({
  className,
  title = "Bangladesh Government Monogram",
}: GovtMonogramProps) {
  return (
    <div
      className={cn(
        "inline-flex aspect-square items-center justify-center rounded-full border border-[#006a4e]/30 bg-white p-1.5 shadow-sm",
        className,
      )}
      role="img"
      aria-label={title}
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="60" cy="60" r="56" fill="#ffffff" stroke="#006a4e" strokeWidth="6" />
        <circle cx="60" cy="60" r="39" fill="#006a4e" fillOpacity="0.08" />
        <circle cx="60" cy="60" r="24" fill="#da291c" />
        <path
          d="M23 60C27 43 41 30 60 30C79 30 93 43 97 60"
          fill="none"
          stroke="#006a4e"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M23 62C27 79 41 92 60 92C79 92 93 79 97 62"
          fill="none"
          stroke="#006a4e"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M60 17L64 26H56L60 17Z"
          fill="#f7d117"
          stroke="#006a4e"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
