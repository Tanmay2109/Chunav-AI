const ChakraLoader = ({ isLoading, theme }) => {
  if (!isLoading) return null;

  // Tiranga: navy chakra on white band. Dark: saffron chakra on dark bg.
  const c = theme === 'tiranga' ? '#000080' : '#FF9933';
  const glowColor = theme === 'tiranga'
    ? 'rgba(0,0,128,0.2)'
    : 'rgba(255,153,51,0.2)';

  return (
    <div className={`chakra-loader-overlay${theme === 'tiranga' ? ' loader-tiranga' : ' loader-dark'}`}>
      {/* Single absolutely-centered content block */}
      <div className="loader-content">

        {/* Spinning Ashoka Chakra */}
        <div className="chakra-spin-wrapper">
          <svg viewBox="0 0 100 100" className="chakra-svg">
            {/* Outer ring */}
            <circle cx="50" cy="50" r="46"
              fill="none" stroke={c} strokeWidth="3" />
            {/* Inner ring */}
            <circle cx="50" cy="50" r="38"
              fill="none" stroke={c} strokeWidth="1.5" />
            {/* Center dot */}
            <circle cx="50" cy="50" r="5"
              fill={c} stroke="none" />
            {/* 24 spokes — start from top (-90°) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 - 90) * (Math.PI / 180);
              const x2 = 50 + 38 * Math.cos(angle);
              const y2 = 50 + 38 * Math.sin(angle);
              return (
                <line key={i}
                  x1="50" y1="50"
                  x2={x2} y2={y2}
                  stroke={c}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              );
            })}
            {/* 24 outer dots on ring */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 - 90) * (Math.PI / 180);
              const x = 50 + 46 * Math.cos(angle);
              const y = 50 + 46 * Math.sin(angle);
              return (
                <circle key={`dot-${i}`}
                  cx={x} cy={y} r="1.8"
                  fill={c}
                />
              );
            })}
          </svg>
          {/* Pulse glow */}
          <div className="chakra-glow"
            style={{ background: `radial-gradient(${glowColor}, transparent 70%)` }}
          />
        </div>

        {/* Tricolor bar */}
        <div className="loader-tricolor">
          <div className="tc-saffron" />
          <div className="tc-white" />
          <div className="tc-green" />
        </div>

        {/* Title */}
        <h1 className="loader-title">Chunav AI</h1>
        <p className="loader-subtitle">भारत का निष्पक्ष चुनाव सहायक</p>

        {/* Three bouncing dots — saffron | navy | green */}
        <div className="loader-dots">
          <span /><span /><span />
        </div>

      </div>
    </div>
  );
};

export default ChakraLoader;
