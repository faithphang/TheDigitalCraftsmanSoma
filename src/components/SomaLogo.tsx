export function SomaLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Isometric cube wireframe in pixel/retro style */}
      
      {/* Top left corner node */}
      <rect x="20" y="20" width="12" height="12" fill="#00ff99" />
      <rect x="24" y="16" width="4" height="4" fill="#00ff99" />
      <rect x="16" y="24" width="4" height="4" fill="#00ff99" />
      
      {/* Top right corner node */}
      <rect x="88" y="20" width="12" height="12" fill="#00ff99" />
      <rect x="92" y="16" width="4" height="4" fill="#00ff99" />
      <rect x="100" y="24" width="4" height="4" fill="#00ff99" />
      
      {/* Bottom left corner node */}
      <rect x="20" y="88" width="12" height="12" fill="#00ff99" />
      <rect x="24" y="100" width="4" height="4" fill="#00ff99" />
      <rect x="16" y="92" width="4" height="4" fill="#00ff99" />
      
      {/* Bottom right corner node */}
      <rect x="88" y="88" width="12" height="12" fill="#00ff99" />
      <rect x="92" y="100" width="4" height="4" fill="#00ff99" />
      <rect x="100" y="92" width="4" height="4" fill="#00ff99" />
      
      {/* Vertical edges */}
      <rect x="24" y="32" width="4" height="56" fill="#00ff99" />
      <rect x="92" y="32" width="4" height="56" fill="#00ff99" />
      
      {/* Top horizontal edge */}
      <rect x="32" y="24" width="56" height="4" fill="#00ff99" />
      
      {/* Bottom horizontal edge */}
      <rect x="32" y="92" width="56" height="4" fill="#00ff99" />
      
      {/* Diagonal connecting lines (depth) */}
      {/* Top left to center */}
      <rect x="28" y="28" width="4" height="4" fill="#00ff99" />
      <rect x="32" y="32" width="4" height="4" fill="#00ff99" />
      <rect x="36" y="36" width="4" height="4" fill="#00ff99" />
      <rect x="40" y="40" width="4" height="4" fill="#00ff99" />
      
      {/* Top right to center */}
      <rect x="84" y="28" width="4" height="4" fill="#00ff99" />
      <rect x="80" y="32" width="4" height="4" fill="#00ff99" />
      <rect x="76" y="36" width="4" height="4" fill="#00ff99" />
      <rect x="72" y="40" width="4" height="4" fill="#00ff99" />
      
      {/* Bottom left to center */}
      <rect x="28" y="84" width="4" height="4" fill="#00ff99" />
      <rect x="32" y="80" width="4" height="4" fill="#00ff99" />
      <rect x="36" y="76" width="4" height="4" fill="#00ff99" />
      <rect x="40" y="72" width="4" height="4" fill="#00ff99" />
      
      {/* Bottom right to center */}
      <rect x="84" y="84" width="4" height="4" fill="#00ff99" />
      <rect x="80" y="80" width="4" height="4" fill="#00ff99" />
      <rect x="76" y="76" width="4" height="4" fill="#00ff99" />
      <rect x="72" y="72" width="4" height="4" fill="#00ff99" />
      
      {/* Center horizontal bars */}
      <rect x="44" y="44" width="8" height="4" fill="#00ff99" />
      <rect x="52" y="48" width="16" height="4" fill="#00ff99" />
      <rect x="68" y="44" width="4" height="4" fill="#00ff99" />
      
      <rect x="36" y="68" width="12" height="4" fill="#00ff99" />
      <rect x="52" y="72" width="20" height="4" fill="#00ff99" />
      
      {/* Center vertical elements */}
      <rect x="68" y="48" width="4" height="24" fill="#00ff99" />
      <rect x="72" y="48" width="4" height="4" fill="#00ff99" />
    </svg>
  );
}
