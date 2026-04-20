import Image from "next/image";

export function TemplateThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--surface-card-alt)] shadow-[inset_0_0_40px_rgba(10,11,13,0.06)]">
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 720px) 100vw, 33vw" unoptimized={src.endsWith(".svg")} />
    </div>
  );
}
