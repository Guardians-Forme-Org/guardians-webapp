type Props = {
  size?: number;
  // White logo — use on dark backgrounds. Defaults to the logo's native
  // dark color, for use on the app's usual white background.
  inverted?: boolean;
};

export default function LogoSpinner({ size = 193, inverted = false }: Props) {
  return (
    <img
      src="/images/Guardians Logo-logo.png"
      alt="Guardians"
      className="object-contain animate-spin"
      style={{
        width: size,
        ...(inverted ? { filter: "brightness(0) invert(1)" } : {}),
        animationDuration: "4s",
      }}
    />
  );
}
