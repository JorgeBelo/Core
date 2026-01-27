interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export const Logo = ({ variant = 'full', className = '', size = 'medium' }: LogoProps) => {
  // Tamanhos proporcionais baseados nas especificações originais (imagens 1024x1024)
  // Ajustado para subtítulo mais visível e proporcional
  // Proporção melhorada: Core 300px / Subtitle ~60px = ~5:1
  // Proporção: Icon C 600px
  const sizes = {
    small: { core: '60px', subtitle: '12px', icon: '120px' },
    medium: { core: '120px', subtitle: '24px', icon: '240px' },
    large: { core: '180px', subtitle: '36px', icon: '360px' },
    xlarge: { core: '300px', subtitle: '60px', icon: '600px' },
  };

  const currentSize = sizes[size];

  if (variant === 'icon') {
    return (
      <div 
        className={`font-brand-core ${className}`} 
        style={{ 
          fontSize: currentSize.icon, 
          lineHeight: '1',
          color: '#a20100'
        }}
      >
        C
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className="font-brand-core"
        style={{ 
          fontSize: currentSize.core, 
          lineHeight: '1',
          color: '#a20100'
        }}
      >
        Core
      </div>
      <div 
        className="font-sans"
        style={{ 
          fontSize: currentSize.subtitle, 
          lineHeight: '1.2',
          color: '#b4b4b4',
          marginTop: '12px',
          fontWeight: '400'
        }}
      >
        Gestão para Personal Trainers
      </div>
    </div>
  );
};
