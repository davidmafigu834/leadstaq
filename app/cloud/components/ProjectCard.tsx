export type ProjectCardStyles = {
  gradient: string;
  border: string;
  badge: string;
  text: string;
  subtext: string;
};

const categoryStyles: Record<string, ProjectCardStyles> = {
  Construction: {
    gradient: 'bg-gradient-to-br from-[#FFF4E6] via-[#FFE0B2] to-[#FFCC80]',
    border: 'border-[#FFB74D]/30',
    badge: 'bg-white/60 text-[#BF6000]',
    text: 'text-[#7A3800]',
    subtext: 'text-[#BF7020]',
  },
  'Solar Installation': {
    gradient: 'bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9]',
    border: 'border-[#64B5F6]/30',
    badge: 'bg-white/60 text-[#0D47A1]',
    text: 'text-[#0D3070]',
    subtext: 'text-[#1565C0]',
  },
  Solar: {
    gradient: 'bg-gradient-to-br from-[#E3F2FD] via-[#BBDEFB] to-[#90CAF9]',
    border: 'border-[#64B5F6]/30',
    badge: 'bg-white/60 text-[#0D47A1]',
    text: 'text-[#0D3070]',
    subtext: 'text-[#1565C0]',
  },
  Landscaping: {
    gradient: 'bg-gradient-to-br from-[#E8F5E9] via-[#C8E6C9] to-[#A5D6A7]',
    border: 'border-[#81C784]/30',
    badge: 'bg-white/60 text-[#1B5E20]',
    text: 'text-[#1B4020]',
    subtext: 'text-[#2E7D32]',
  },
  Electrical: {
    gradient: 'bg-gradient-to-br from-[#FFFDE7] via-[#FFF9C4] to-[#FFF176]',
    border: 'border-[#FFD54F]/30',
    badge: 'bg-white/60 text-[#795800]',
    text: 'text-[#5A4000]',
    subtext: 'text-[#8C6A00]',
  },
  Roofing: {
    gradient: 'bg-gradient-to-br from-[#EFEBE9] via-[#D7CCC8] to-[#BCAAA4]',
    border: 'border-[#A1887F]/30',
    badge: 'bg-white/60 text-[#4E342E]',
    text: 'text-[#3E2723]',
    subtext: 'text-[#5D4037]',
  },
  'Interior Design': {
    gradient: 'bg-gradient-to-br from-[#FCE4EC] via-[#F8BBD9] to-[#F48FB1]',
    border: 'border-[#F06292]/30',
    badge: 'bg-white/60 text-[#880E4F]',
    text: 'text-[#6A0636]',
    subtext: 'text-[#AD1457]',
  },
  Fencing: {
    gradient: 'bg-gradient-to-br from-[#EFEBE9] via-[#D7CCC8] to-[#BCAAA4]',
    border: 'border-[#A1887F]/30',
    badge: 'bg-white/60 text-[#4E342E]',
    text: 'text-[#3E2723]',
    subtext: 'text-[#5D4037]',
  },
  Plumbing: {
    gradient: 'bg-gradient-to-br from-[#E0F7FA] via-[#B2EBF2] to-[#80DEEA]',
    border: 'border-[#4DD0E1]/30',
    badge: 'bg-white/60 text-[#006064]',
    text: 'text-[#004D54]',
    subtext: 'text-[#00838F]',
  },
  Architecture: {
    gradient: 'bg-gradient-to-br from-[#F3E5F5] via-[#E1BEE7] to-[#CE93D8]',
    border: 'border-[#BA68C8]/30',
    badge: 'bg-white/60 text-[#4A148C]',
    text: 'text-[#38006b]',
    subtext: 'text-[#6A1B9A]',
  },
  Events: {
    gradient: 'bg-gradient-to-br from-[#FCE4EC] via-[#F8BBD9] to-[#F48FB1]',
    border: 'border-[#F06292]/30',
    badge: 'bg-white/60 text-[#880E4F]',
    text: 'text-[#6A0636]',
    subtext: 'text-[#AD1457]',
  },
  Other: {
    gradient: 'bg-gradient-to-br from-[#F3E5F5] via-[#E1BEE7] to-[#CE93D8]',
    border: 'border-[#BA68C8]/30',
    badge: 'bg-white/60 text-[#4A148C]',
    text: 'text-[#38006b]',
    subtext: 'text-[#6A1B9A]',
  },
};

export function getProjectCardStyles(category: string | null | undefined): ProjectCardStyles {
  if (!category) return categoryStyles['Other'];
  return categoryStyles[category] ?? categoryStyles['Other'];
}
