export default function Logo({ size = 32, color = '#232F72' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Círculo de fondo con acento */}
      <circle cx="32" cy="32" r="30" stroke={color} strokeWidth="2.5" fill="none" />

      {/* Letra F estilizada (FixIt) */}
      <path
        d="M22 20 H42 M22 20 V44 M22 32 H38"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Llave inglesa minimalista en la esquina */}
      <circle cx="45" cy="45" r="6" stroke={color} strokeWidth="2.5" fill="#FFFFFF" />
      <path
        d="M42 42 L48 48"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}