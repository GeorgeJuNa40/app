// Logo Move yA — wordmark SVG escalable.
// El elemento distintivo es el "swirl" (cinta enrollada) que reemplaza la "o",
// la "y" en tono durazno y un flourish (cinta) sobre la "A".
// Funciona sobre fondo oscuro (forest) o claro (crema/blanco) vía `theme`.

interface LogoProps {
  height?: number;
  theme?: 'onDark' | 'onLight';
  /** Aplica clases para animación de entrada (usado por el Splash). */
  animated?: boolean;
  className?: string;
  title?: string;
}

const PALETTES = {
  onDark: {
    word: '#CBDCCC',
    y: '#CBAB95',
    swirlA: '#EAF3EC', // cinta clara
    swirlB: '#7FA98F', // cinta media
    flourish: '#A9C9B2',
    glow: '#F7F0DE',
  },
  onLight: {
    word: '#2D5A4C',
    y: '#B57A57',
    swirlA: '#5E8C7A',
    swirlB: '#2D5A4C',
    flourish: '#5E8C7A',
    glow: 'transparent',
  },
} as const;

const FONT =
  "'Poppins','Nunito','Quicksand',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

export default function Logo({
  height = 48,
  theme = 'onDark',
  animated = false,
  className = '',
  title = 'Move yA',
}: LogoProps) {
  const p = PALETTES[theme];
  const ratio = 900 / 260;
  const uid = theme; // ids únicos por tema para evitar colisión de gradientes
  const a = animated ? 'mya-anim' : '';

  return (
    <svg
      role="img"
      aria-label={title}
      width={height * ratio}
      height={height}
      viewBox="0 0 900 260"
      className={`${a ? 'mya-logo' : ''} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`swA-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.swirlA} />
          <stop offset="1" stopColor={p.swirlB} />
        </linearGradient>
        <linearGradient id={`swB-${uid}`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.swirlB} />
          <stop offset="1" stopColor={p.swirlA} />
        </linearGradient>
        <linearGradient id={`fl-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={p.swirlB} />
          <stop offset="1" stopColor={p.flourish} />
        </linearGradient>
        <radialGradient id={`glow-${uid}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.glow} stopOpacity={theme === 'onDark' ? 0.55 : 0} />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Glow cálido detrás del swirl */}
      <circle className={`${a} mya-glow`} cx="240" cy="120" r="110" fill={`url(#glow-${uid})`} />

      {/* Wordmark: M · swirl(o) · ve · y · A */}
      <g fontFamily={FONT} fontWeight={800} fontSize="170" style={{ letterSpacing: '-2px' }}>
        <text className={`${a} mya-l1`} x="24" y="188" fill={p.word}>M</text>
        <text className={`${a} mya-l2`} x="332" y="188" fill={p.word}>ve</text>
        <text className={`${a} mya-l3`} x="600" y="188" fill={p.y}>y</text>
        <text className={`${a} mya-l4`} x="710" y="188" fill={p.word}>A</text>
      </g>

      {/* Swirl (la "o"). Outer=posición fija; inner=animación (no pisa el translate). */}
      <g transform="translate(240 118)">
        <g className={`${a} mya-swirl`}>
          <path
            d="M0,-63 A63,63 0 0 1 0,63 A31.5,31.5 0 0 1 0,0 A31.5,31.5 0 0 0 0,-63 Z"
            fill={`url(#swA-${uid})`}
          />
          <path
            d="M0,-63 A63,63 0 0 0 0,63 A31.5,31.5 0 0 0 0,0 A31.5,31.5 0 0 1 0,-63 Z"
            fill={`url(#swB-${uid})`}
          />
          <circle cx="0" cy="-31.5" r="7" fill={p.swirlB} opacity="0.55" />
          <circle cx="0" cy="31.5" r="7" fill={p.swirlA} opacity="0.75" />
        </g>
      </g>

      {/* Flourish (cinta) sobre la "A" */}
      <path
        className={`${a} mya-flourish`}
        d="M696,150 C738,52 820,26 854,66 C870,86 860,120 840,118"
        pathLength={1}
        fill="none"
        stroke={`url(#fl-${uid})`}
        strokeWidth="13"
        strokeLinecap="round"
      />
    </svg>
  );
}
