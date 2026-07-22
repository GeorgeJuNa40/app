// Avatar: muestra la foto del usuario si existe; si no, sus iniciales.
export default function Avatar({
  url,
  initials,
  className = 'h-9 w-9 text-sm',
}: {
  url?: string;
  initials: string;
  className?: string;
}) {
  if (url) {
    return <img src={url} alt="" className={`rounded-full object-cover ${className}`} />;
  }
  return (
    <span className={`grid place-items-center rounded-full bg-brand text-cream font-bold ${className}`}>
      {initials}
    </span>
  );
}
