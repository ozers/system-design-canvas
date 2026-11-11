export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="max-w-[640px]">
      <p className="text-[12.5px] font-medium text-ink-3">{eyebrow}</p>
      <h2 className="mt-2 text-[24px] leading-[1.25] font-semibold tracking-[-0.015em] text-balance text-ink sm:text-[28px]">
        {title}
      </h2>
      {children && <p className="mt-3 text-[14.5px] leading-[1.6] text-pretty text-ink-2">{children}</p>}
    </div>
  );
}
