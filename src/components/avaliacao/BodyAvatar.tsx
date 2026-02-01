import { useMemo } from 'react';

interface Props {
  percentualGordura: number;
  sexo: 'M' | 'F';
  protocolo?: string;
  dobras?: {
    peitoral?: number;
    abdominal?: number;
    coxa?: number;
    axilar_media?: number;
    triceps?: number;
    subescapular?: number;
    suprailiaca?: number;
  };
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const BodyAvatar = ({ 
  percentualGordura, 
  sexo, 
  protocolo,
  dobras = {},
  width = 200, 
  height = 400,
  showLabels = false 
}: Props) => {
  
  // Calcula a cor baseada no percentual de gordura (gradiente verde -> amarelo -> vermelho)
  const getColorFromPercentage = (percentage: number): string => {
    // Verde (baixo) -> Amarelo (médio) -> Vermelho (alto)
    if (sexo === 'M') {
      if (percentage < 10) return '#22c55e'; // Verde escuro
      if (percentage < 15) return '#84cc16'; // Verde claro
      if (percentage < 20) return '#eab308'; // Amarelo
      if (percentage < 25) return '#f97316'; // Laranja
      return '#ef4444'; // Vermelho
    } else {
      if (percentage < 18) return '#22c55e';
      if (percentage < 23) return '#84cc16';
      if (percentage < 28) return '#eab308';
      if (percentage < 33) return '#f97316';
      return '#ef4444';
    }
  };
  
  const mainColor = useMemo(() => getColorFromPercentage(percentualGordura), [percentualGordura, sexo]);
  
  // Calcula cor específica por região (se tiver dobras)
  const getRegionColor = (dobra?: number): string => {
    if (!dobra) return mainColor;
    
    // Dobras menores = menos gordura = mais verde
    // Dobras maiores = mais gordura = mais vermelho
    if (dobra < 10) return '#22c55e';
    if (dobra < 15) return '#84cc16';
    if (dobra < 20) return '#eab308';
    if (dobra < 30) return '#f97316';
    return '#ef4444';
  };
  
  const peitoralColor = getRegionColor(dobras.peitoral);
  const abdominalColor = getRegionColor(dobras.abdominal);
  const coxaColor = getRegionColor(dobras.coxa);
  const tricepsColor = getRegionColor(dobras.triceps);
  const subescapularColor = getRegionColor(dobras.subescapular);
  const suprailiacaColor = getRegionColor(dobras.suprailiaca);
  const axilarColor = getRegionColor(dobras.axilar_media);
  
  if (sexo === 'M') {
    return (
      <svg width={width} height={height} viewBox="0 0 200 400" className="mx-auto">
        {/* Gradiente de fundo */}
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={mainColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={mainColor} stopOpacity="0.6" />
          </linearGradient>
          
          {/* Sombra */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Cabeça */}
        <circle cx="100" cy="30" r="20" fill={mainColor} opacity="0.4" filter="url(#shadow)" />
        
        {/* Pescoço */}
        <rect x="90" y="48" width="20" height="15" fill={mainColor} opacity="0.5" />
        
        {/* Tronco */}
        <ellipse cx="100" cy="130" rx="50" ry="70" fill="url(#bodyGradient)" filter="url(#shadow)" />
        
        {/* Região Peitoral */}
        {dobras.peitoral && (
          <circle cx="85" cy="90" r="12" fill={peitoralColor} opacity="0.8">
            <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Região Abdominal */}
        {dobras.abdominal && (
          <circle cx="100" cy="140" r="15" fill={abdominalColor} opacity="0.8">
            <animate attributeName="r" values="15;17;15" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Região Axilar */}
        {dobras.axilar_media && (
          <circle cx="70" cy="100" r="10" fill={axilarColor} opacity="0.8">
            <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Região Tríceps */}
        {dobras.triceps && (
          <circle cx="45" cy="130" r="10" fill={tricepsColor} opacity="0.8">
            <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Região Subescapular */}
        {dobras.subescapular && (
          <circle cx="120" cy="110" r="10" fill={subescapularColor} opacity="0.8">
            <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Região Supra-ilíaca */}
        {dobras.suprailiaca && (
          <circle cx="125" cy="150" r="10" fill={suprailiacaColor} opacity="0.8">
            <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Braços */}
        <rect x="30" y="80" width="15" height="100" rx="7" fill={mainColor} opacity="0.5" filter="url(#shadow)" />
        <rect x="155" y="80" width="15" height="100" rx="7" fill={mainColor} opacity="0.5" filter="url(#shadow)" />
        
        {/* Pernas */}
        <rect x="70" y="200" width="25" height="150" rx="12" fill={mainColor} opacity="0.6" filter="url(#shadow)" />
        <rect x="105" y="200" width="25" height="150" rx="12" fill={mainColor} opacity="0.6" filter="url(#shadow)" />
        
        {/* Região Coxa */}
        {dobras.coxa && (
          <circle cx="82" cy="250" r="12" fill={coxaColor} opacity="0.8">
            <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Labels */}
        {showLabels && dobras.peitoral && (
          <text x="85" y="85" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
            {dobras.peitoral}mm
          </text>
        )}
        {showLabels && dobras.abdominal && (
          <text x="100" y="135" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
            {dobras.abdominal}mm
          </text>
        )}
        {showLabels && dobras.coxa && (
          <text x="82" y="245" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
            {dobras.coxa}mm
          </text>
        )}
      </svg>
    );
  } else {
    // Avatar Feminino
    return (
      <svg width={width} height={height} viewBox="0 0 200 400" className="mx-auto">
        <defs>
          <linearGradient id="bodyGradientF" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={mainColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={mainColor} stopOpacity="0.6" />
          </linearGradient>
          
          <filter id="shadowF">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Cabeça */}
        <circle cx="100" cy="30" r="20" fill={mainColor} opacity="0.4" filter="url(#shadowF)" />
        
        {/* Pescoço */}
        <rect x="92" y="48" width="16" height="15" fill={mainColor} opacity="0.5" />
        
        {/* Tronco (mais curvilíneo) */}
        <ellipse cx="100" cy="120" rx="45" ry="60" fill="url(#bodyGradientF)" filter="url(#shadowF)" />
        
        {/* Região Tríceps */}
        {dobras.triceps && (
          <circle cx="50" cy="120" r="10" fill={tricepsColor} opacity="0.8">
            <animate attributeName="r" values="10;12;10" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Região Supra-ilíaca */}
        {dobras.suprailiaca && (
          <circle cx="120" cy="140" r="12" fill={suprailiacaColor} opacity="0.8">
            <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Região Abdominal */}
        {dobras.abdominal && (
          <circle cx="100" cy="130" r="13" fill={abdominalColor} opacity="0.8">
            <animate attributeName="r" values="13;15;13" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Braços */}
        <rect x="35" y="80" width="13" height="90" rx="6" fill={mainColor} opacity="0.5" filter="url(#shadowF)" />
        <rect x="152" y="80" width="13" height="90" rx="6" fill={mainColor} opacity="0.5" filter="url(#shadowF)" />
        
        {/* Quadril */}
        <ellipse cx="100" cy="190" rx="50" ry="30" fill={mainColor} opacity="0.5" filter="url(#shadowF)" />
        
        {/* Pernas */}
        <rect x="70" y="210" width="23" height="150" rx="11" fill={mainColor} opacity="0.6" filter="url(#shadowF)" />
        <rect x="107" y="210" width="23" height="150" rx="11" fill={mainColor} opacity="0.6" filter="url(#shadowF)" />
        
        {/* Região Coxa */}
        {dobras.coxa && (
          <circle cx="81" cy="260" r="12" fill={coxaColor} opacity="0.8">
            <animate attributeName="r" values="12;14;12" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        
        {/* Labels */}
        {showLabels && dobras.triceps && (
          <text x="50" y="115" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
            {dobras.triceps}mm
          </text>
        )}
        {showLabels && dobras.suprailiaca && (
          <text x="120" y="135" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
            {dobras.suprailiaca}mm
          </text>
        )}
        {showLabels && dobras.coxa && (
          <text x="81" y="255" fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
            {dobras.coxa}mm
          </text>
        )}
      </svg>
    );
  }
};
