import Image from "next/image";

export function GenieMark({ size = 28 }: { size?: number }) {
  const px = `${size}px`;
  const radius = `${Math.round(size * 0.22)}px`;

  return (
    <span
      className="relative inline-flex shrink-0 overflow-hidden"
      style={{
        borderRadius: radius,
        height: px,
        minHeight: px,
        minWidth: px,
        width: px,
      }}
    >
      <Image
        alt="Genie"
        className="rounded-[inherit] object-contain"
        height={size}
        src="/images/genie-logo.png"
        unoptimized
        width={size}
      />
    </span>
  );
}
