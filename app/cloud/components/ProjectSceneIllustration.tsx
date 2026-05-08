type Props = { className?: string; width?: number; height?: number };

export default function ProjectSceneIllustration({ className, width = 220, height = 160 }: Props) {
  return (
    <svg
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      className={className}
      aria-hidden="true"
    >
      {/* Ground shadow */}
      <ellipse cx="110" cy="152" rx="88" ry="7" fill="#E0E0D8" opacity="0.55" />

      {/* Building — main body */}
      <rect x="64" y="72" width="92" height="78" rx="2" fill="#F0EDE8" stroke="#D8D4CE" strokeWidth="1.4" />

      {/* Roof */}
      <polygon points="55,74 110,36 165,74" fill="#E4E0D8" stroke="#D0CCC8" strokeWidth="1.4" />

      {/* Chimney */}
      <rect x="126" y="40" width="10" height="18" rx="1" fill="#DDDAD6" stroke="#C8C4C0" strokeWidth="1" />

      {/* Left window */}
      <rect x="76" y="88" width="22" height="26" rx="2" fill="#C8D8E8" stroke="#B8C8D8" strokeWidth="1" />
      <line x1="87" y1="88" x2="87" y2="114" stroke="#B8C8D8" strokeWidth="0.8" />
      <line x1="76" y1="101" x2="98" y2="101" stroke="#B8C8D8" strokeWidth="0.8" />

      {/* Right window */}
      <rect x="122" y="88" width="22" height="26" rx="2" fill="#C8D8E8" stroke="#B8C8D8" strokeWidth="1" />
      <line x1="133" y1="88" x2="133" y2="114" stroke="#B8C8D8" strokeWidth="0.8" />
      <line x1="122" y1="101" x2="144" y2="101" stroke="#B8C8D8" strokeWidth="0.8" />

      {/* Door */}
      <rect x="99" y="118" width="22" height="32" rx="2" fill="#C0BAB2" stroke="#A8A29C" strokeWidth="1" />
      <circle cx="117" cy="134" r="1.8" fill="#888480" />

      {/* Person — body */}
      <rect x="26" y="104" width="13" height="22" rx="5" fill="#6B7280" />
      {/* Person — head */}
      <circle cx="32" cy="98" r="7" fill="#9CA3AF" />
      {/* Hair */}
      <path d="M25 96 Q32 89 39 96" fill="#6B7280" />
      {/* Left arm — raised with phone */}
      <path d="M39 108 L54 102" stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round" />
      {/* Right arm */}
      <path d="M26 110 L14 118" stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round" />
      {/* Legs */}
      <path d="M29 126 L27 150" stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M35 126 L37 150" stroke="#6B7280" strokeWidth="3.5" strokeLinecap="round" />

      {/* Phone in raised hand */}
      <rect x="52" y="93" width="12" height="19" rx="2.5" fill="#1C1C1C" />
      <rect x="54" y="96" width="8" height="10" rx="1" fill="#D4FF4F" opacity="0.9" />
      <circle cx="58" cy="109" r="1.5" fill="#555" />

      {/* Floating photo card 1 — rotated left */}
      <g transform="rotate(-9 145 38)">
        <rect x="131" y="26" width="28" height="22" rx="4" fill="white" stroke="#D8D4CE" strokeWidth="1" />
        <rect x="134" y="29" width="22" height="12" rx="2" fill="#DCF0E8" />
        {/* tiny mountain icon */}
        <polyline points="136,38 139,34 142,37 146,32 149,38" stroke="#6BAE88" strokeWidth="1" fill="none" />
      </g>

      {/* Floating photo card 2 — rotated right */}
      <g transform="rotate(7 175 22)">
        <rect x="161" y="12" width="28" height="22" rx="4" fill="white" stroke="#D8D4CE" strokeWidth="1" />
        <rect x="164" y="15" width="22" height="12" rx="2" fill="#DBE8F8" />
        {/* tiny sun icon */}
        <circle cx="175" cy="21" r="3" fill="#F0B040" opacity="0.7" />
      </g>

      {/* Lime accent dots — sparkles */}
      <circle cx="188" cy="56" r="2.5" fill="#D4FF4F" />
      <circle cx="174" cy="44" r="1.5" fill="#D4FF4F" opacity="0.65" />
      <circle cx="198" cy="72" r="1.2" fill="#D4FF4F" opacity="0.8" />
      <circle cx="50" cy="60" r="1.8" fill="#D4FF4F" opacity="0.5" />
    </svg>
  );
}
