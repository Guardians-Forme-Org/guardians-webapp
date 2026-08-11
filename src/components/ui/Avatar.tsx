import type { CSSProperties } from "react";

type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: CSSProperties;
};

export default function Avatar({
  src,
  alt = "",
  className = "",
  style,
}: Props) {
  return (
    <div
      className={`overflow-hidden ${src ? "bg-white" : "bg-white"} ${className}`}
      style={style}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <img
          src="/images/Guardians Logo-logo.png"
          alt=""
          className="w-full h-full object-cover opacity-80"
        />
      )}
    </div>
  );
}
