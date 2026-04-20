export type NorthfieldContent = {
  top_bar: {
    license_text: string;
    availability_text: string;
    phone_display: string;
    company_name: string;
  };
  hero: {
    eyebrow: string;
    headline_line_1: string;
    headline_italic_word: string;
    headline_line_2: string;
    headline_line_3: string;
    headline_underlined: string;
    lede: string;
    meta_stats: Array<{ label: string; value: string }>;
  };
  quote_card: {
    tag: string;
    title: string;
    subtitle: string;
    submit_label: string;
    caption: string;
  };
  marquee: {
    items: Array<{ text: string; accent_word: string | null }>;
  };
  stats: {
    section_number: string;
    section_title_prefix: string;
    section_title_italic: string;
    section_title_suffix: string;
    items: Array<{
      number: string;
      superscript: string | null;
      label: string;
    }>;
  };
  services: {
    section_number: string;
    section_title_prefix: string;
    section_title_italic: string;
    section_title_suffix: string;
    intro: string;
    items: Array<{
      number: string;
      title_prefix: string;
      title_italic: string;
      title_suffix: string | null;
      description: string;
      tags: string[];
    }>;
  };
  projects: {
    section_number: string;
    section_title_prefix: string;
    section_title_italic: string;
    section_title_suffix: string;
    items: Array<{
      number: string;
      name_prefix: string;
      name_italic: string;
      type_heading: string;
      type_detail: string;
      completed_heading: string;
      completed_detail: string;
      value: string;
      image_url: string | null;
    }>;
  };
  process: {
    section_number: string;
    section_title_prefix: string;
    section_title_italic: string;
    section_title_suffix: string;
    steps: Array<{
      number: string;
      title_prefix: string;
      title_italic: string;
      title_suffix: string | null;
      description: string;
    }>;
  };
  testimonial: {
    quote_parts: {
      opening: string;
      italic_1: string;
      middle: string;
      italic_2: string;
      closing: string;
    };
    author_initials: string;
    author_name: string;
    author_role: string;
  };
  cta: {
    title_prefix: string;
    title_italic: string;
    subtitle: string;
    action_label: string;
    phone_display: string;
    hours_text: string;
  };
  footer: {
    tagline: string;
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
    copyright: string;
    legal_links: Array<{ label: string; href: string }>;
  };
};

export type NorthfieldTheme = {
  primary_color: string;
  ink_color: string;
  paper_color: string;
};
