type CardVariant =
  | 'storage'
  | 'team'
  | 'activity'
  | 'upload'
  | 'storage-usage'
  | 'watermark'
  | 'profile'
  | 'billing'
  | 'stats'
  | 'white';

const gradients: Record<CardVariant, string> = {
  storage: 'bg-[#0a0a0a]',
  team: 'bg-gradient-to-br from-[#FFFBF0] via-[#FFF3D0] to-[#FFE8A0]',
  activity: 'bg-gradient-to-br from-[#F5F0FF] via-[#EDE5FF] to-[#DDD0FF]',
  upload: 'bg-gradient-to-br from-[#F0FFF8] via-[#E0FFF0] to-[#C8FFE0]',
  'storage-usage': 'bg-gradient-to-br from-[#F0F8FF] via-[#E0F0FF] to-[#C8E4FF]',
  watermark: 'bg-gradient-to-br from-[#FFF5F5] via-[#FFE8E8] to-[#FFD0D0]',
  profile: 'bg-gradient-to-br from-[#FFF8F0] via-[#FFEEDD] to-[#FFE0C0]',
  billing: 'bg-gradient-to-br from-[#F8FFE0] via-[#EEFF99] to-[#E4FF66]',
  stats: 'bg-gradient-to-br from-[#F8F8F4] via-[#F0F0EA] to-[#E8E8E0]',
  white: 'bg-white',
};

const borders: Record<CardVariant, string> = {
  storage: 'border-white/[0.06]',
  team: 'border-[#FFD070]/30',
  activity: 'border-[#C4A8FF]/30',
  upload: 'border-[#60E8A0]/30',
  'storage-usage': 'border-[#80C8FF]/30',
  watermark: 'border-[#FFB0B0]/30',
  profile: 'border-[#FFB870]/30',
  billing: 'border-[#C8FF20]/40',
  stats: 'border-[#D0D0C0]/40',
  white: 'border-black/[0.07]',
};

type Props = {
  variant: CardVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function SectionCard({ variant, children, className, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-[20px] border overflow-hidden',
        gradients[variant],
        borders[variant],
        onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : '',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
