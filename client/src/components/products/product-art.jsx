import { useId } from "react";

const INK = "#14110c";
const GOLD = "#f5b700";
const ORANGE = "#f97316";

/** Low-poly vase facets, tinted by palette (used for the multi-colour vase). */
function vase(palette, w = 30, h = 92) {
  const rows = 7;
  const cols = 4;
  const r = (t) => w * (0.55 + 0.45 * Math.sin(t * Math.PI * 0.95 + 0.25));
  const out = [];
  for (let i = 0; i < rows; i++) {
    const t0 = i / rows;
    const t1 = (i + 1) / rows;
    const y0 = t0 * h;
    const y1 = t1 * h;
    for (let j = 0; j < cols; j++) {
      const p = (rr, k) => -rr + (2 * rr * k) / cols;
      const c = palette[(i + j) % palette.length];
      const d = palette[(i + j + 1) % palette.length];
      out.push(<polygon key={`a${i}${j}`} points={`${p(r(t0), j)},${y0} ${p(r(t0), j + 1)},${y0} ${p(r(t1), j)},${y1}`} fill={c} />);
      out.push(<polygon key={`b${i}${j}`} points={`${p(r(t0), j + 1)},${y0} ${p(r(t1), j + 1)},${y1} ${p(r(t1), j)},${y1}`} fill={d} />);
    }
  }
  return out;
}

const gear = (cx, cy, r, n, fill = "#52525b") => {
  const pts = [];
  for (let i = 0; i < n * 4; i++) {
    const a = (i / (n * 4)) * Math.PI * 2;
    const rr = i % 4 < 2 ? r : r * 0.82;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return (
    <g>
      <polygon points={pts.join(" ")} fill={fill} stroke="#a1a1aa" strokeWidth="1.2" />
      <circle cx={cx} cy={cy} r={r * 0.32} fill="#18181b" />
    </g>
  );
};

const SCENES = {
  skeleton: () => (
    <g>
      <ellipse cx="100" cy="140" rx="34" ry="6" fill="#d6d3d1" />
      <ellipse cx="100" cy="137" rx="30" ry="5" fill="#f5f5f4" />
      <circle cx="100" cy="42" r="14" fill="#f5f5f4" stroke="#a8a29e" />
      <circle cx="95" cy="41" r="3" fill={INK} /><circle cx="106" cy="41" r="3" fill={INK} />
      <rect x="94" y="52" width="12" height="5" rx="1" fill="#e7e5e4" stroke="#a8a29e" />
      <rect x="98" y="58" width="4" height="40" rx="2" fill="#f5f5f4" stroke="#a8a29e" />
      {[64, 72, 80, 88].map((y, i) => (<path key={y} d={`M${80 + i} ${y} Q100 ${y - 6} ${120 - i} ${y}`} fill="none" stroke="#a8a29e" strokeWidth="3" strokeLinecap="round" />))}
      <path d="M82 66 L62 52 L52 34" fill="none" stroke="#f5f5f4" strokeWidth="5" strokeLinecap="round" />
      <path d="M118 66 L138 80 L146 100" fill="none" stroke="#f5f5f4" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="100" cy="102" rx="14" ry="6" fill="#e7e5e4" stroke="#a8a29e" />
      <path d="M92 106 L84 128 L78 136" fill="none" stroke="#f5f5f4" strokeWidth="5" strokeLinecap="round" />
      <path d="M108 106 L118 124 L126 136" fill="none" stroke="#f5f5f4" strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  keychain: () => (
    <g transform="rotate(-12 100 80)">
      <circle cx="100" cy="30" r="14" fill="none" stroke="#a1a1aa" strokeWidth="5" />
      <rect x="82" y="40" width="36" height="8" rx="3" fill="#a1a1aa" />
      <rect x="48" y="52" width="104" height="48" rx="10" fill={INK} stroke={GOLD} strokeWidth="2.5" />
      <path d="M78 52 l6 -10 l8 7 l8 -9 l8 9 l8 -7 l6 10 z" fill={GOLD} />
      <text x="100" y="86" fontSize="22" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="Outfit, sans-serif">Name</text>
    </g>
  ),
  lamp: () => (
    <g>
      <ellipse cx="100" cy="82" rx="58" ry="46" fill={GOLD} opacity="0.35" className="glow" />
      <rect x="62" y="34" width="76" height="92" rx="8" fill="#fde68a" />
      <rect x="62" y="34" width="76" height="92" rx="8" fill="url(#lampg)" />
      <circle cx="86" cy="74" r="10" fill="#7c2d12" opacity="0.75" /><rect x="74" y="84" width="24" height="38" rx="9" fill="#7c2d12" opacity="0.75" />
      <circle cx="116" cy="70" r="10" fill="#431407" opacity="0.65" /><rect x="104" y="80" width="24" height="42" rx="9" fill="#431407" opacity="0.65" />
      <rect x="54" y="124" width="92" height="12" rx="4" fill="#fcd34d" />
    </g>
  ),
  phone: () => (
    <g>
      <path d="M48 128 L152 128 L140 138 L60 138 Z" fill="#27272a" />
      <path d="M70 128 L96 52 L112 56 L100 128 Z" fill="#3f3f46" />
      <g transform="rotate(14 112 80)"><rect x="92" y="26" width="52" height="96" rx="9" fill={INK} stroke="#52525b" strokeWidth="2" /><rect x="97" y="33" width="42" height="80" rx="4" fill="#1e3a8a" /><rect x="97" y="33" width="42" height="80" rx="4" fill="url(#phoneg)" /></g>
    </g>
  ),
  figurine: () => (
    <g>
      <ellipse cx="100" cy="138" rx="46" ry="7" fill="#00000022" />
      <polygon points="70,128 78,86 96,92 100,128" fill="#ea580c" />
      <polygon points="96,92 128,86 134,128 100,128" fill="#f97316" />
      <polygon points="78,86 90,62 112,70 128,86 96,92" fill="#fb923c" />
      <polygon points="90,62 84,34 100,50" fill="#c2410c" /><polygon points="112,70 124,38 126,64" fill="#ea580c" />
      <polygon points="90,62 100,50 112,70 100,76" fill="#ffb25e" />
      <polygon points="128,86 160,74 150,104 134,128" fill="#c2410c" /><polygon points="134,128 150,104 164,118" fill="#fb923c" />
      <circle cx="96" cy="64" r="2.2" fill={INK} /><circle cx="108" cy="68" r="2.2" fill={INK} />
    </g>
  ),
  tissue: () => (
    <g>
      <path d="M92 52 Q100 20 112 50 Q124 26 130 54 Z" fill="#fff" stroke="#d4d4d8" />
      <rect x="44" y="56" width="112" height="72" rx="8" fill="#f4f4f5" stroke="#d4d4d8" />
      <rect x="82" y="56" width="36" height="9" rx="4" fill="#d4d4d8" />
      {Array.from({ length: 4 }, (_, r) => Array.from({ length: 8 }, (_, c) => (
        <polygon key={`${r}${c}`} points={`${54 + c * 12},${74 + r * 13} ${60 + c * 12},${68 + r * 13} ${66 + c * 12},${74 + r * 13} ${60 + c * 12},${80 + r * 13}`} fill={(r + c) % 2 ? "#3b82f6" : "#93c5fd"} />
      )))}
    </g>
  ),
  pen: () => (
    <g>
      {[["#ef4444", 82, -18], ["#3b82f6", 100, -4], ["#111827", 118, 10], ["#7c3aed", 132, 20]].map(([c, x, rot]) => (
        <rect key={c} x={x - 3} y="20" width="6" height="62" rx="3" fill={c} transform={`rotate(${rot} ${x} 90)`} />
      ))}
      <path d="M60 70 L140 70 L134 132 Q100 140 66 132 Z" fill="#18181b" />
      {Array.from({ length: 5 }, (_, i) => (<path key={i} d={`M${64 + i * 4} 76 L${100} 132 L${136 - i * 4} 76`} fill="none" stroke="#52525b" strokeWidth="1.4" />))}
      <ellipse cx="100" cy="70" rx="40" ry="7" fill="#27272a" />
    </g>
  ),
  fish: () => (
    <g>
      <rect x="96" y="76" width="8" height="64" rx="4" fill="#f59e0b" transform="rotate(8 100 108)" />
      <polygon points="60,70 28,40 36,76 24,104 62,84" fill="#ec4899" opacity="0.9" /><polygon points="62,70 40,60 44,80 60,84" fill="#f472b6" />
      <ellipse cx="96" cy="64" rx="34" ry="20" fill="#2563eb" /><ellipse cx="102" cy="58" rx="22" ry="9" fill="#60a5fa" opacity="0.7" />
      <polygon points="96,44 112,18 126,48" fill="#ec4899" /><polygon points="120,70 150,52 146,80 152,96 120,82" fill="#db2777" />
      <circle cx="116" cy="60" r="4" fill="#fff" /><circle cx="117" cy="60" r="2" fill={INK} />
    </g>
  ),
  vase: () => (
    <g>
      <ellipse cx="100" cy="140" rx="30" ry="5" fill="#00000022" />
      <g transform="translate(100 44)">{vase(["#ec4899", "#db2777", "#3b82f6", "#2563eb", "#f472b6", "#60a5fa"])}</g>
    </g>
  ),
  gears: () => (
    <g>
      {gear(86, 84, 40, 10)}
      {gear(142, 56, 24, 8, "#3f3f46")}
      {gear(138, 118, 20, 7, "#71717a")}
    </g>
  ),
  gift: () => (
    <g>
      <rect x="52" y="64" width="96" height="68" rx="6" fill="#dc2626" />
      <rect x="46" y="52" width="108" height="20" rx="5" fill="#ef4444" />
      <rect x="93" y="52" width="14" height="80" fill={GOLD} />
      <path d="M100 52 C80 20 56 40 82 52 Z M100 52 C120 20 144 40 118 52 Z" fill={GOLD} />
    </g>
  ),
  cube: () => (
    <g>
      <polygon points="100,34 148,60 100,86 52,60" fill="#fbbf24" />
      <polygon points="52,60 100,86 100,140 52,112" fill={ORANGE} />
      <polygon points="148,60 100,86 100,140 148,112" fill="#c2410c" />
    </g>
  ),
};

/** Chooses an illustration from the product's name, then its category. */
export function sceneFor(product) {
  const text = `${product?.name ?? ""} ${product?.slug ?? ""} ${product?.categories?.name ?? ""}`.toLowerCase();
  const rules = [
    ["skeleton", "skeleton"], ["keychain", "keychain"], ["key chain", "keychain"], ["lamp", "lamp"], ["phone", "phone"],
    ["tissue", "tissue"], ["pen holder", "pen"], ["pencil", "fish"], ["betta", "fish"], ["fish", "fish"], ["vase", "vase"],
    ["figur", "figurine"], ["animal", "figurine"], ["prototype", "gears"], ["engineer", "gears"], ["gear", "gears"],
    ["gift", "gift"], ["toy", "figurine"], ["pen", "pen"], ["key", "keychain"], ["colour", "vase"], ["color", "vase"],
  ];
  return rules.find(([k]) => text.includes(k))?.[1] ?? "cube";
}

/** Illustrated stand-in shown until a real product photo is uploaded. */
export function ProductArt({ product, scene, className }) {
  const id = useId().replace(/:/g, "");
  const Scene = SCENES[scene ?? sceneFor(product)] ?? SCENES.cube;
  return (
    <svg viewBox="0 0 200 160" className={className} role="img" aria-label={product?.name ? `Illustration of ${product.name}` : "Product illustration"} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}bg`} cx="50%" cy="38%" r="75%"><stop offset="0" stopColor="#fffaf0" /><stop offset="1" stopColor="#f6ead0" /></radialGradient>
        <linearGradient id="lampg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff7d6" stopOpacity="0.9" /><stop offset="1" stopColor="#f59e0b" stopOpacity="0.5" /></linearGradient>
        <linearGradient id="phoneg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#60a5fa" /><stop offset="1" stopColor="#7c3aed" /></linearGradient>
      </defs>
      <rect width="200" height="160" fill={`url(#${id}bg)`} />
      <circle cx="30" cy="26" r="40" fill={GOLD} opacity="0.1" />
      <circle cx="176" cy="140" r="46" fill={ORANGE} opacity="0.08" />
      <Scene />
    </svg>
  );
}
