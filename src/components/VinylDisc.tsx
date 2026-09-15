interface VinylDiscProps {
  coverImageUrl?: string | null;
  label: string;
  spinning?: boolean;
  size?: number;
}

export default function VinylDisc({
  coverImageUrl,
  label,
  spinning = true,
  size = 260,
}: VinylDiscProps) {
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-hidden={false}
    >
      <div
        className={`absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_#0c0908_0%,_#1c1410_38%,_#0c0908_39%,_#1c1410_46%,_#0c0908_47%,_#1c1410_60%,_#0c0908_61%,_#1c1410_74%,_#0c0908_75%,_#0c0908_100%)] shadow-2xl ${
          spinning ? "animate-spin-slow" : ""
        }`}
      />
      <div
        className="absolute rounded-full overflow-hidden border-4 border-vinyl-black-soft flex items-center justify-center bg-vinyl-accent-dim"
        style={{
          width: size * 0.42,
          height: size * 0.42,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] text-center px-2 text-vinyl-cream/80 font-display leading-tight">
            {label}
          </span>
        )}
      </div>
      <div
        className="absolute rounded-full bg-vinyl-black"
        style={{
          width: size * 0.06,
          height: size * 0.06,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
}
