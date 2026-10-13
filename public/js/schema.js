// Content schema shared by the viewer, the admin portal and the server.
// It is the single definition of what the admin is allowed to edit: only the
// fields declared here exist, and every value is plain text, a URL, an icon
// name or a colour choice from a fixed palette. Layout and markup live in the
// viewer code and can never be changed from the admin portal.

export const ACCENTS = ['primary', 'secondary', 'tertiary'];

const text = (label, max = 120, extra = {}) => ({ type: 'text', label, max, ...extra });
const area = (label, max = 2000, extra = {}) => ({ type: 'textarea', label, max, ...extra });
const url = (label, extra = {}) => ({ type: 'url', label, ...extra });
const icon = (label = 'Icon') => ({ type: 'icon', label });
const accent = (label = 'Accent colour') => ({ type: 'accent', label });
const bool = (label) => ({ type: 'bool', label });
const num = (label, min, max, initial) => ({ type: 'number', label, min, max, initial });
// A name picked from another section's list (the admin shows it as a dropdown).
const ref = (label, source) => ({ type: 'ref', label, source, max: 120 });
const list = (label, itemLabel, titleKey, fields, max = 50) => ({ type: 'list', label, itemLabel, titleKey, fields, max });
const group = (label, fields, extra = {}) => ({ type: 'group', label, fields, ...extra });

const sectionHeader = {
  eyebrow: text('Eyebrow (small label above heading)', 60),
  heading: text('Heading', 120),
  intro: area('Intro paragraph', 600),
};

// One tab of a nation page (Wiki, Government, Military): a heading block, side
// stats and a row of cards such as armed-forces branches or ministries.
const panel = (label) => group(label, {
  tag: text('Tag (e.g. CONFEDERATE ARMED FORCES)', 80),
  ref: text('Reference line', 80),
  title: text('Title', 120),
  body: area('Text — blank line between paragraphs, **word** to highlight', 6000),
  stats: list('Side stats', 'Stat', 'label', {
    label: text('Label', 40),
    value: text('Value', 60),
    accent: accent(),
  }, 4),
  cardsHeading: text('Cards heading (e.g. Active Sovereign Branches)', 60),
  cardsNote: text('Cards note', 60),
  cards: list('Cards', 'Card', 'name', {
    name: text('Name', 80),
    subtitle: text('Subtitle', 80),
    icon: icon(),
    accent: accent(),
    role: area('Role', 1000),
    assets: text('Key assets', 300),
  }, 9),
});

// A lore page section (Races, History, Religions): an overview page plus one
// detail page per entry, each with quick facts and free-form text sections.
// Fields every lore entry page has: image, quick facts, text sections, linked nations.
const loreExtras = {
  image: url('Image URL (optional)', { optional: true }),
  facts: list('Quick facts', 'Fact', 'label', {
    label: text('Label', 40),
    value: text('Value', 120),
  }, 10),
  sections: list('Text sections', 'Section', 'heading', {
    heading: text('Heading', 80),
    body: area('Text — blank line between paragraphs, **word** to highlight', 6000),
  }, 12),
  nations: list('Linked nations', 'Nation', 'name', {
    name: ref('Nation', 'nations'),
  }, 20),
};

const loreSection = (label, itemLabel, tagLabel, iconName, extra = {}) => group(label, {
  ...sectionHeader,
  items: list(label, itemLabel, 'name', {
    name: text('Name (also used in the page link)', 80),
    tag: text(tagLabel, 40),
    summary: text('Short summary (cards and the Universe menu)', 160),
    ...extra,
    icon: icon(),
    accent: accent(),
    ...loreExtras,
  }, 60),
}, { icon: iconName });

export const schema = group('Content', {
  site: group('Site & Brand', {
    pageTitle: text('Browser tab title', 120),
    brandName: text('Brand name', 40),
    brandTagline: text('Brand tagline', 60),
    crestImage: url('Crest image URL'),
    footerText: text('Footer text', 200),
  }, { icon: 'shield' }),

  hero: group('Hero', {
    title: text('Title', 40),
    subtitle: text('Subtitle', 60),
    hook: area('Story hook', 600),
    backgroundImage: url('Background image URL'),
    primaryButton: text('Primary button label', 40),
    secondaryButton: text('Secondary button label', 40),
  }, { icon: 'wallpaper' }),

  story: group('The Story', {
    ...sectionHeader,
    acts: list('Acts', 'Act', 'title', {
      label: text('Label (e.g. Act 01 // Cosmogenesis)', 60),
      icon: icon(),
      accent: accent(),
      title: text('Title', 80),
      body: area('Body', 1200),
      footer: text('Footer line', 80),
      highlight: bool('Highlight this card (current act)'),
      ...loreExtras,
    }, 12),
  }, { icon: 'auto_stories' }),

  universe: group('Universe Menu', {
    footerNote: text('Menu footer note', 80),
  }, { icon: 'public' }),

  regions: loreSection('Continents & Regions', 'Region', 'Type tag (e.g. Sky Realm)', 'travel_explore', {
    subregions: text('Sub-regions (e.g. High Skylands, Sun Spire)', 160),
  }),

  races: loreSection('Races', 'Race', 'Type tag (e.g. Sky Dwellers)', 'diversity_1'),
  history: loreSection('History', 'Event', 'Date / era tag (e.g. -1150 A.C.)', 'history_edu'),
  religions: loreSection('Religions', 'Religion', 'Faith type (e.g. Monotheistic)', 'church'),

  nations: group('Nations', {
    ...sectionHeader,
    items: list('Nations', 'Nation', 'name', {
      code: text('Code (e.g. NUS)', 8),
      name: text('Name', 80),
      icon: icon(),
      accent: accent(),
      emblemCaption: text('Emblem caption', 40),
      category: text('Category tag', 30),
      specialty: text('Specialty line', 80),
      affinity: text('Affinity', 40),
      status: text('Status', 20),
      // ----- Nation page -----
      officialName: text('Official name (e.g. Confederate States of Aethelgard)', 120),
      altName: text('Alternate / common name line', 120),
      dossier: area('Overview (hero paragraph on the nation page)', 3000),
      heroImage: url('Hero background image URL (optional)', { optional: true }),
      flag: url('Flag image URL (optional)', { optional: true }),
      capital: text('Capital city', 60),
      leader: text('Current leader', 80),
      currency: text('National currency', 60),
      stats: list('Stat cards (population, language, religion…)', 'Stat', 'label', {
        label: text('Label', 40),
        icon: icon(),
        accent: accent(),
        value: area('Value (new line = line break)', 200),
        note: text('Note', 160),
      }, 6),
      wiki: panel('Wiki tab'),
      government: panel('Government tab'),
      military: panel('Military tab'),
      organizations: list('Organizations tab — linked organizations', 'Organization', 'name', {
        name: ref('Organization', 'organizations'),
      }, 20),
    }, 30),
  }, { icon: 'flag' }),

  characters: group('Characters', {
    eyebrow: text('Menu footer label', 60),
    heading: text('Menu heading', 120),
    items: list('Characters', 'Character', 'name', {
      name: text('Name (also used in the page link)', 60),
      title: text('Title (shown on cards)', 60),
      realm: text('Realm', 60),
      element: text('Element tag', 20),
      icon: icon(),
      accent: accent(),
      rankBadge: text('Rank badge (e.g. TIER-1 OPERATIVE // CQC)', 100),
      designation: text('Designation line under the name', 120),
      statusTag: text('Portrait status tag', 60),
      idCode: text('ID code', 30),
      portrait: url('Portrait — front (also used on cards, optional)', { optional: true }),
      portraitLeft: url('Portrait — left 45° (optional)', { optional: true }),
      portraitRight: url('Portrait — right 45° (optional)', { optional: true }),
      quote: area('Signature quote', 400),
      quoteSource: text('Quote source', 100),
      profileRef: text('Profile reference code', 40),
      facts: list('Profile facts (age, nationality, height…)', 'Fact', 'label', {
        label: text('Label', 40),
        value: text('Value', 120),
        note: text('Small note (optional)', 160),
        highlight: bool('Highlight value'),
        wide: bool('Full width'),
      }, 16),
      clearance: text('Biography section tag (e.g. Section II // Clearance OMEGA)', 60),
      bioTag: text('Biography badge', 40),
      bioSummary: text('Biography summary line', 240),
      bio: area('Biography — blank line between paragraphs, **word** to highlight', 6000),
      kinshipTag: text('Family badge', 40),
      kinshipSummary: text('Family summary line', 240),
      kinship: list('Family & ties', 'Relation', 'name', {
        name: text('Name', 80),
        relation: text('Relation tag (e.g. Sister // Core Tether)', 50),
        accent: accent('Tag colour'),
        description: area('Description', 800),
        featured: bool('Feature this relation'),
      }, 12),
      personality: list('Personality traits', 'Trait', 'title', {
        title: text('Title', 60),
        tag: text('Tag', 60),
        description: area('Description', 1000),
        highlight: bool('Highlight title'),
      }, 8),
      endorsementTitle: text('Endorsement title (optional)', 60),
      endorsementText: text('Endorsement text', 240),
    }, 40),
  }, { icon: 'group' }),

  maps: group('Maps', {
    heading: text('Page title (browser tab)', 60),
    hudBadges: list('Status strip badges', 'Badge', 'text', {
      text: text('Text', 60),
      icon: icon(),
      accent: accent(),
      alert: bool('Alert style (red)'),
    }, 5),
    hudCounters: list('Status strip counters', 'Counter', 'label', {
      label: text('Label', 30),
      value: text('Value', 30),
      accent: accent(),
    }, 3),
    items: list('Maps', 'Map', 'name', {
      tab: text('Tab label (e.g. MAP RECON ATLAS)', 40),
      tabIcon: icon('Tab icon'),
      eyebrow: text('Eyebrow (e.g. TACTICAL RECON CARTOGRAPHY)', 60),
      name: text('Title', 80),
      description: area('Description', 1000),
      image: url('Map image URL (optional)', { optional: true }),
      icon: icon('Fallback icon (used when no image)'),
      coordinates: text('Coordinate readout (e.g. LAT 44°12\'08"N // LON 12°54\'10"E)', 60),
      hudStatus: text('Map corner status line', 60),
      pins: list('Pins — hover the map on the Maps page to read X/Y', 'Pin', 'label', {
        label: text('Pin label (e.g. FROSTSPIRE)', 40),
        x: num('X position (% from left, 0–100)', 0, 100, 50),
        y: num('Y position (% from top, 0–100)', 0, 100, 50),
        accent: accent(),
        major: bool('Major pin (larger, with icon)'),
        icon: icon('Icon (major pins only)'),
        labelBelow: bool('Show label below the pin'),
        tag: text('Panel tag (e.g. SECTOR 03 // CSA)', 40),
        threat: text('Panel status (e.g. DEFCON ALPHA)', 30),
        title: text('Panel title', 80),
        subtitle: text('Panel subtitle', 80),
        description: area('Panel description', 1500),
        metrics: list('Metrics', 'Metric', 'label', {
          label: text('Label', 40),
          value: text('Value', 60),
          accent: accent(),
        }, 4),
        nation: text('Linked nation code (adds an "Explore" button, e.g. NUS)', 8),
      }, 30),
    }, 12),
  }, { icon: 'map' }),

  organizations: group('Organizations', {
    eyebrow: text('Menu footer label', 60),
    heading: text('Menu heading', 120),
    items: list('Organizations', 'Organization', 'name', {
      name: text('Short name / acronym (also used in the page link)', 40),
      fullName: text('Full name', 120),
      type: text('Type (e.g. Intelligence Agency)', 40),
      icon: icon('Fallback icon (used when no sigil image)'),
      accent: accent(),
      sigil: url('Sigil image URL (optional)', { optional: true }),
      motto: text('Motto', 120),
      founded: text('Founded', 40),
      headquarters: text('Headquarters', 80),
      jurisdiction: text('Jurisdiction / reach', 80),
      purpose: area('Purpose / mission', 1500),
      description: area('Description / overview', 4000),
      leader: group('Leader', {
        name: text('Name', 60),
        title: text('Title', 60),
        photo: url('Photo URL (optional)', { optional: true }),
        bio: area('Biography', 2000),
      }),
      units: list('Units & divisions', 'Unit', 'name', {
        name: text('Name', 80),
        icon: icon(),
        photo: url('Photo URL (optional)', { optional: true }),
        description: area('Description', 1000),
      }, 20),
    }, 30),
  }, { icon: 'account_balance' }),
});

// Validates `value` against `node` and returns a clean copy containing only
// schema fields. Throws an Error naming the offending path on bad input.
export function validate(value, node = schema, path = 'content') {
  const fail = (msg) => { throw new Error(`${path}: ${msg}`); };
  switch (node.type) {
    case 'group': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) fail('expected an object');
      const out = {};
      for (const [key, child] of Object.entries(node.fields)) {
        out[key] = validate(value[key], child, `${path}.${key}`);
      }
      return out;
    }
    case 'list': {
      if (!Array.isArray(value)) fail('expected a list');
      if (value.length > node.max) fail(`at most ${node.max} entries allowed`);
      return value.map((item, i) => validate(item, { type: 'group', fields: node.fields }, `${path}[${i}]`));
    }
    case 'text':
    case 'ref':
    case 'textarea': {
      if (typeof value !== 'string') fail('expected text');
      const v = node.type !== 'textarea' ? value.replace(/\s+/g, ' ').trim() : value.replace(/\r\n/g, '\n').trim();
      if (v.length > node.max) fail(`must be ${node.max} characters or fewer`);
      return v;
    }
    case 'url': {
      if (typeof value !== 'string') fail('expected a URL');
      const v = value.trim();
      if (!v && node.optional) return '';
      if (!/^https:\/\/[^\s"'<>]+$/i.test(v) && !/^\/[\w\-./]+$/.test(v)) fail('must be an https:// URL or a /path on this site');
      if (v.length > 2000) fail('URL is too long');
      return v;
    }
    case 'icon': {
      if (typeof value !== 'string' || !/^[a-z0-9_]{1,40}$/.test(value.trim())) fail('must be a Material Symbols icon name like "shield"');
      return value.trim();
    }
    case 'accent': {
      if (!ACCENTS.includes(value)) fail(`must be one of ${ACCENTS.join(', ')}`);
      return value;
    }
    case 'bool':
      return value === true;
    case 'number': {
      if (typeof value !== 'number' || !Number.isFinite(value)) fail('expected a number');
      if (value < node.min || value > node.max) fail(`must be between ${node.min} and ${node.max}`);
      return Math.round(value * 10) / 10;
    }
    default:
      fail('unknown field type');
  }
}

// Blank value for a node, used when the admin adds a new list entry.
export function blank(node) {
  switch (node.type) {
    case 'group': return Object.fromEntries(Object.entries(node.fields).map(([k, f]) => [k, blank(f)]));
    case 'list': return [];
    case 'icon': return 'star';
    case 'accent': return 'primary';
    case 'bool': return false;
    case 'number': return node.initial ?? node.min;
    default: return '';
  }
}
