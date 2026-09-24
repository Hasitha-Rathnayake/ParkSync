export default function HeroIllustration() {
  return (
    <svg viewBox="0 0 520 420" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 460 }}>
      {/* ground shadow */}
      <ellipse cx="260" cy="360" rx="220" ry="26" fill="#FFF1F3" />

      {/* parking bay lines */}
      <g stroke="#E0E0E0" strokeWidth="4" opacity="0.9">
        <path d="M 90 340 L 110 250" fill="none" />
        <path d="M 190 340 L 195 240" fill="none" />
        <path d="M 300 340 L 295 240" fill="none" />
        <path d="M 410 340 L 395 250" fill="none" />
      </g>

      {/* parked car (side) - left, muted neutral */}
      <g transform="translate(60,230)">
        <rect x="10" y="35" width="120" height="35" rx="10" fill="#C9CDD2" />
        <path d="M25,35 Q35,10 60,10 H95 Q115,10 122,35 Z" fill="#C9CDD2" />
        <circle cx="35" cy="70" r="12" fill="#3A3A3A" />
        <circle cx="110" cy="70" r="12" fill="#3A3A3A" />
      </g>

      {/* parked car (side) - right, muted neutral */}
      <g transform="translate(340,235)">
        <rect x="10" y="32" width="115" height="33" rx="10" fill="#D9DCE0" />
        <path d="M24,32 Q34,9 58,9 H90 Q109,9 116,32 Z" fill="#D9DCE0" />
        <circle cx="33" cy="65" r="11" fill="#3A3A3A" />
        <circle cx="103" cy="65" r="11" fill="#3A3A3A" />
      </g>

      {/* highlighted empty slot with coral glow */}
      <rect x="205" y="230" width="110" height="6" fill="#FF385C" opacity="0.9" rx="3" />
      <text x="260" y="270" fill="#FF385C" fontSize="15" fontWeight="700" textAnchor="middle" fontFamily="Poppins, Segoe UI, Arial, sans-serif">P</text>

      {/* main car - coral, driving toward the empty slot */}
      <g transform="translate(178,140)">
        <ellipse cx="82" cy="102" rx="95" ry="10" fill="#000000" opacity="0.08" />
        <rect x="8" y="46" width="150" height="42" rx="14" fill="#FF385C" />
        <path d="M28,46 Q40,14 68,14 H102 Q126,14 136,46 Z" fill="#FF385C" />
        <path d="M42,44 Q50,24 68,24 H98 Q114,24 122,44 Z" fill="#B31E42" opacity="0.5" />
        <circle cx="38" cy="90" r="15" fill="#2B2B2B" />
        <circle cx="38" cy="90" r="6" fill="#F2F2F2" />
        <circle cx="128" cy="90" r="15" fill="#2B2B2B" />
        <circle cx="128" cy="90" r="6" fill="#F2F2F2" />
        <rect x="150" y="58" width="12" height="8" rx="3" fill="#FFE1B8" />
      </g>

      {/* location pin above the empty slot */}
      <g transform="translate(240,60)">
        <path d="M20,0 C31,0 40,9 40,20 C40,34 20,58 20,58 C20,58 0,34 0,20 C0,9 9,0 20,0 Z" fill="#FF385C" />
        <circle cx="20" cy="20" r="9" fill="#FFFFFF" />
      </g>

      {/* subtle motion lines behind main car */}
      <g stroke="#FF385C" strokeWidth="3" opacity="0.25" strokeLinecap="round">
        <line x1="150" y1="180" x2="110" y2="180" />
        <line x1="150" y1="196" x2="120" y2="196" />
        <line x1="150" y1="212" x2="130" y2="212" />
      </g>
    </svg>
  );
}
