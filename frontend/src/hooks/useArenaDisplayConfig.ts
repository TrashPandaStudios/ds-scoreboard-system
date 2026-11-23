import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SpectatorTheme } from './useSpectatorTheme';

export type ArenaDisplayElement =
  | 'header'
  | 'current'
  | 'clock'
  | 'scores'
  | 'sets'
  | 'next'
  | 'upcoming'
  | 'recent'
  | 'sponsors'
  | 'controls';

export type ArenaDisplayVisibility = Record<ArenaDisplayElement, boolean>;

export type ArenaDisplayMode = 'display' | 'detail';

export type ArenaDisplayPresetId = 'full' | 'staging' | 'current-next' | 'scoreboard';

export const ALL_ARENA_DISPLAY_ELEMENTS: ArenaDisplayElement[] = [
  'header',
  'current',
  'clock',
  'scores',
  'sets',
  'next',
  'upcoming',
  'recent',
  'sponsors',
  'controls',
];

const CONTENT_ELEMENTS: ArenaDisplayElement[] = [
  'current',
  'sets',
  'next',
  'upcoming',
  'recent',
  'sponsors',
];

const ELEMENT_ALIASES: Record<string, ArenaDisplayElement> = {
  header: 'header',
  nav: 'header',
  topbar: 'header',
  current: 'current',
  currentmatch: 'current',
  live: 'current',
  match: 'current',
  clock: 'clock',
  timer: 'clock',
  scores: 'scores',
  score: 'scores',
  sets: 'sets',
  setbreakdown: 'sets',
  breakdown: 'sets',
  next: 'next',
  nextmatch: 'next',
  ondeck: 'next',
  upcoming: 'upcoming',
  upcomingmatches: 'upcoming',
  queue: 'upcoming',
  schedule: 'upcoming',
  recent: 'recent',
  recentmatches: 'recent',
  results: 'recent',
  earlier: 'recent',
  sponsors: 'sponsors',
  sponsor: 'sponsors',
  controls: 'controls',
  toolbar: 'controls',
};

export const DISPLAY_MODE_DEFAULTS: Record<ArenaDisplayMode, ArenaDisplayVisibility> = {
  display: {
    header: true,
    current: true,
    clock: true,
    scores: true,
    sets: false,
    next: true,
    upcoming: true,
    recent: false,
    sponsors: false,
    controls: true,
  },
  detail: {
    header: true,
    current: true,
    clock: true,
    scores: true,
    sets: true,
    next: true,
    upcoming: true,
    recent: true,
    sponsors: false,
    controls: true,
  },
};

export const DISPLAY_PRESETS: Record<
  ArenaDisplayPresetId,
  {
    id: ArenaDisplayPresetId;
    label: string;
    description: string;
    visibility: Partial<ArenaDisplayVisibility>;
  }
> = {
  full: {
    id: 'full',
    label: 'Full arena board',
    description: 'Current match, next match on deck, and upcoming queue.',
    visibility: {
      header: true,
      current: true,
      clock: true,
      scores: true,
      sets: false,
      next: true,
      upcoming: true,
      recent: false,
    },
  },
  staging: {
    id: 'staging',
    label: 'Pit / staging queue',
    description: 'Hides the current match so waiting teams see Next Match and Upcoming Queue.',
    visibility: {
      header: true,
      current: false,
      sets: false,
      next: true,
      upcoming: true,
      recent: false,
    },
  },
  'current-next': {
    id: 'current-next',
    label: 'Current + next match',
    description: 'Focused hallway view with the live match and who is on deck next.',
    visibility: {
      header: true,
      current: true,
      clock: true,
      scores: true,
      sets: false,
      next: true,
      upcoming: false,
      recent: false,
    },
  },
  scoreboard: {
    id: 'scoreboard',
    label: 'Live match + sets',
    description: 'Current match scoreboard and set-by-set breakdown without the schedule queue.',
    visibility: {
      header: true,
      current: true,
      clock: true,
      scores: true,
      sets: true,
      next: false,
      upcoming: false,
      recent: false,
    },
  },
};

const DEFAULT_UPCOMING_LIMIT = 8;

function resolveElementKey(raw: string): ArenaDisplayElement | null {
  const normalized = raw.trim().toLowerCase().replace(/[-_\s]/g, '');
  return ELEMENT_ALIASES[normalized] ?? null;
}

function parseBoolFlag(raw: string | null): boolean | null {
  if (raw === null) return null;
  const v = raw.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return null;
}

function parseElementList(raw: string | null): ArenaDisplayElement[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map(resolveElementKey)
    .filter((k): k is ArenaDisplayElement => k !== null);
}

export function parseArenaDisplaySearchParams(
  searchParams: URLSearchParams,
  mode: ArenaDisplayMode
): {
  visibility: ArenaDisplayVisibility;
  upcomingLimit: number;
  themeOverride: SpectatorTheme | null;
} {
  const visibility: ArenaDisplayVisibility = { ...DISPLAY_MODE_DEFAULTS[mode] };

  // 1) Optional named preset
  const presetParam = searchParams.get('preset')?.trim().toLowerCase() as ArenaDisplayPresetId | undefined;
  if (presetParam && DISPLAY_PRESETS[presetParam]) {
    Object.assign(visibility, DISPLAY_PRESETS[presetParam].visibility);
  }

  // 2) Optional explicit allowlist (?only=next,upcoming)
  const onlyList = parseElementList(searchParams.get('only'));
  if (onlyList.length > 0) {
    for (const key of CONTENT_ELEMENTS) {
      visibility[key] = false;
    }
    for (const key of onlyList) {
      visibility[key] = true;
    }
  }

  // 3) Kiosk shortcut (?kiosk=1 hides interactive controls)
  const kioskFlag = parseBoolFlag(searchParams.get('kiosk'));
  if (kioskFlag === true) {
    visibility.controls = false;
  } else if (kioskFlag === false) {
    visibility.controls = true;
  }

  // 4) Explicit show list (?show=sets,recent,sponsors)
  for (const key of parseElementList(searchParams.get('show'))) {
    visibility[key] = true;
  }

  // 5) Explicit hide list (?hide=current,clock,header)
  for (const key of parseElementList(searchParams.get('hide'))) {
    visibility[key] = false;
  }

  // 6) Individual boolean params (?current=0, ?next=1, ?upcoming=0, ?currentMatch=false, etc.)
  searchParams.forEach((value, paramKey) => {
    const resolved = resolveElementKey(paramKey);
    if (!resolved) return;
    const parsed = parseBoolFlag(value);
    if (parsed !== null) {
      visibility[resolved] = parsed;
    }
  });

  // 7) Upcoming queue limit (?limit=6 or ?limit=all / ?limit=0)
  const rawLimit = searchParams.get('limit');
  let upcomingLimit = DEFAULT_UPCOMING_LIMIT;
  if (rawLimit !== null) {
    const lowered = rawLimit.trim().toLowerCase();
    if (lowered === 'all' || lowered === '0') {
      upcomingLimit = 0;
    } else {
      const parsed = parseInt(lowered, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        upcomingLimit = Math.min(50, parsed);
      }
    }
  }

  // 8) Theme override (?theme=dark|light)
  const rawTheme = searchParams.get('theme')?.trim().toLowerCase();
  const themeOverride: SpectatorTheme | null =
    rawTheme === 'dark' || rawTheme === 'light' ? rawTheme : null;

  return { visibility, upcomingLimit, themeOverride };
}

export function buildArenaDisplaySearchParams(
  visibility: ArenaDisplayVisibility,
  upcomingLimit: number,
  themeOverride: SpectatorTheme | null,
  mode: ArenaDisplayMode
): URLSearchParams {
  const defaults = DISPLAY_MODE_DEFAULTS[mode];
  const params = new URLSearchParams();

  const hidden: ArenaDisplayElement[] = [];
  const shown: ArenaDisplayElement[] = [];

  for (const key of ALL_ARENA_DISPLAY_ELEMENTS) {
    if (key === 'controls') continue; // encoded cleanly as kiosk=1
    if (defaults[key] && !visibility[key]) {
      hidden.push(key);
    } else if (!defaults[key] && visibility[key]) {
      shown.push(key);
    }
  }

  if (hidden.length > 0) {
    params.set('hide', hidden.join(','));
  }
  if (shown.length > 0) {
    params.set('show', shown.join(','));
  }
  if (!visibility.controls) {
    params.set('kiosk', '1');
  }
  if (upcomingLimit !== DEFAULT_UPCOMING_LIMIT) {
    params.set('limit', upcomingLimit === 0 ? 'all' : String(upcomingLimit));
  }
  if (themeOverride) {
    params.set('theme', themeOverride);
  }

  return params;
}

export function useArenaDisplayConfig(mode: ArenaDisplayMode) {
  const [searchParams, setSearchParams] = useSearchParams();

  const parsed = useMemo(
    () => parseArenaDisplaySearchParams(searchParams, mode),
    [searchParams, mode]
  );

  const commit = useCallback(
    (
      nextVisibility: ArenaDisplayVisibility,
      nextLimit: number,
      nextTheme: SpectatorTheme | null
    ) => {
      const nextParams = buildArenaDisplaySearchParams(nextVisibility, nextLimit, nextTheme, mode);
      setSearchParams(nextParams, { replace: true });
    },
    [mode, setSearchParams]
  );

  const setElementVisible = useCallback(
    (key: ArenaDisplayElement, visible: boolean) => {
      const nextVisibility: ArenaDisplayVisibility = {
        ...parsed.visibility,
        [key]: visible,
      };
      commit(nextVisibility, parsed.upcomingLimit, parsed.themeOverride);
    },
    [parsed, commit]
  );

  const toggleElement = useCallback(
    (key: ArenaDisplayElement) => {
      setElementVisible(key, !parsed.visibility[key]);
    },
    [parsed.visibility, setElementVisible]
  );

  const applyPreset = useCallback(
    (presetId: ArenaDisplayPresetId) => {
      const preset = DISPLAY_PRESETS[presetId];
      if (!preset) return;
      const nextVisibility: ArenaDisplayVisibility = {
        ...parsed.visibility,
        ...preset.visibility,
      };
      commit(nextVisibility, parsed.upcomingLimit, parsed.themeOverride);
    },
    [parsed, commit]
  );

  const setUpcomingLimit = useCallback(
    (limit: number) => {
      commit(parsed.visibility, limit, parsed.themeOverride);
    },
    [parsed, commit]
  );

  const setThemeOverride = useCallback(
    (themeOverride: SpectatorTheme | null) => {
      commit(parsed.visibility, parsed.upcomingLimit, themeOverride);
    },
    [parsed, commit]
  );

  const resetDefaults = useCallback(() => {
    commit({ ...DISPLAY_MODE_DEFAULTS[mode] }, DEFAULT_UPCOMING_LIMIT, null);
  }, [mode, commit]);

  const buildPathWithCurrentConfig = useCallback(
    (targetPath: string, targetMode: ArenaDisplayMode = mode) => {
      const params = buildArenaDisplaySearchParams(
        parsed.visibility,
        parsed.upcomingLimit,
        parsed.themeOverride,
        targetMode
      );
      const query = params.toString();
      return query ? `${targetPath}?${query}` : targetPath;
    },
    [parsed, mode]
  );

  const hasCustomizations = useMemo(() => {
    const defaults = DISPLAY_MODE_DEFAULTS[mode];
    const anyVisDiff = ALL_ARENA_DISPLAY_ELEMENTS.some((k) => parsed.visibility[k] !== defaults[k]);
    return anyVisDiff || parsed.upcomingLimit !== DEFAULT_UPCOMING_LIMIT || parsed.themeOverride !== null;
  }, [parsed, mode]);

  return {
    visibility: parsed.visibility,
    upcomingLimit: parsed.upcomingLimit,
    themeOverride: parsed.themeOverride,
    hasCustomizations,
    setElementVisible,
    toggleElement,
    applyPreset,
    setUpcomingLimit,
    setThemeOverride,
    resetDefaults,
    buildPathWithCurrentConfig,
  };
}
