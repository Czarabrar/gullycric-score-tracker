// GullyTurf Theme - Sporty Refined Stadium Theme
// v4.0 Master Implementation

export const PALETTE = {
    // Brand / Accents
    accentPrimary: '#2563EB', // Sporty Blue (Example, user said "accentPrimary" but didn't give hex. Using a standard sporty blue or keeping existing popBlue if preferred, but "Refined" suggests less "Pop". Let's use a strong, professional blue.)
    // WAIT. User said "accentPrimary" in the requirements but didn't specify the HEX for it.
    // However, they DID specify "Team Color Injection".
    // And "Start Toss Button" uses theme.accentPrimary.
    // I will use a refined Royal Blue as default accentPrimary.
    royalBlue: '#2563EB',

    // Status / Runs
    runNeutral: '#F3F4F6', // Light gray for 0,1,2,3
    runFour: '#22C55E',    // Green
    runSix: '#22C55E',     // Green (User said 4 and 6 are theme.runFour/Six, usually green)
    runWicket: '#EF4444',  // Red
    wide: '#F59E0B',       // Amber/Orange
    noBall: '#F59E0B',     // Amber/Orange

    // Neutrals - Light Mode
    lightBackgroundStart: '#EEF2F6',
    lightBackgroundEnd: '#E4EAF1',
    lightSurface: '#FFFFFF',
    lightSurfaceElevated: '#FFFFFF',
    lightTextPrimary: '#1F2937',   // Gray-900
    lightTextSecondary: '#6B7280', // Gray-500
    lightBorder: '#E5E7EB',        // Gray-200

    // Neutrals - Dark Mode
    darkBackgroundStart: '#111318',
    darkBackgroundEnd: '#181C23',
    darkSurface: '#1E222B',
    darkSurfaceElevated: '#232732', // Slightly lighter than surface
    darkTextPrimary: '#F1F3F5',
    darkTextSecondary: '#ADB5BD',
    darkBorder: '#2A2E37',

    // Legacy / Compat (Keep minimal if needed, but mostly replacing)
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Pastel Colors (User Request)
    pastelSky: '#7DD3FC',    // Sky Blue
    pastelRed: '#FCA5A5',    // Red Pastel
    pastelYellow: '#FDE047', // Yellow Pastel
    pastelOrange: '#FDBA74', // Orange Pastel

    // Legacy / Backwards Compatibility (Added to fix lint/runtime errors)
    charcoal: '#1F2937',   // Matches lightTextPrimary
    slate: '#6B7280',      // Matches lightTextSecondary
    cream: '#F9FAFB',      // Off-white/Light Gray
    lightGray: '#E5E7EB',  // Matches lightBorder
    cloud: '#F3F4F6',      // Light Background
    popBlue: '#2563EB',    // Matches royalBlue
    popRed: '#EF4444',     // Matches runWicket
    mint: '#D1FAE5',       // Light Green
    skyBlue: '#7DD3FC',    // Matches pastelSky
    steelBlue: '#4B5563',  // Darker Blue-Gray
    powderBlue: '#E0F2FE', // Very light blue
    orange: '#F59E0B',     // Matches wide/noBall
    popYellow: '#FFD700',  // Gold/Yellow
    popOrange: '#F97316',  // Bright Orange
    popGreen: '#22C55E',   // Bright Green
};

export const GRADIENTS = {
    // New Standard Gradients
    neutral: [PALETTE.lightBackgroundStart, PALETTE.lightBackgroundEnd], // Fallback
    light: [PALETTE.lightBackgroundStart, PALETTE.lightBackgroundEnd],
    dark: [PALETTE.darkBackgroundStart, PALETTE.darkBackgroundEnd],
    darkPage: [PALETTE.darkBackgroundStart, PALETTE.darkBackgroundEnd], // Alias for dark
    pastel: [PALETTE.lightBackgroundStart, PALETTE.lightBackgroundEnd], // Compat alias

    // IPL Team Gradients (Keeping for compatibility, but usage will be restricted)
    mi: ['#004BA0', '#002E63'],
    csk: ['#FFCC00', '#F9A000'],
    rcb: ['#EC1C24', '#990000'],
    kkr: ['#3A225D', '#240F3E'],
    dc: ['#004C93', '#00264A'],
    rr: ['#EA1A85', '#9F0F58'],
    srh: ['#F7A721', '#B77404'],
    pbks: ['#ED1B24', '#8C0B11'],
    gt: ['#1C1C1C', '#0B4973'],
    lsg: ['#A72056', '#aeff00'], // Updated LSG
};

// IPL Team Colors Data (Refined)
export const IPL_TEAM_COLORS = [
    { id: 'mi', name: 'Mumbai', primary: '#004BA0', secondary: '#D1AB3E', gradient: GRADIENTS.mi },
    { id: 'csk', name: 'Chennai', primary: '#FFCC00', secondary: '#0066B3', gradient: GRADIENTS.csk },
    { id: 'rcb', name: 'Bangalore', primary: '#EC1C24', secondary: '#000000', gradient: GRADIENTS.rcb },
    { id: 'kkr', name: 'Kolkata', primary: '#3A225D', secondary: '#B6862C', gradient: GRADIENTS.kkr },
    { id: 'dc', name: 'Delhi', primary: '#004C93', secondary: '#EF1B23', gradient: GRADIENTS.dc },
    { id: 'rr', name: 'Rajasthan', primary: '#EA1A85', secondary: '#254AA5', gradient: GRADIENTS.rr },
    { id: 'srh', name: 'Hyderabad', primary: '#F7A721', secondary: '#000000', gradient: GRADIENTS.srh },
    { id: 'pbks', name: 'Punjab', primary: '#ED1B24', secondary: '#A7A9AC', gradient: GRADIENTS.pbks },
    { id: 'gt', name: 'Gujarat', primary: '#1C1C1C', secondary: '#0B4973', gradient: GRADIENTS.gt },
    { id: 'lsg', name: 'Lucknow', primary: '#A72056', secondary: '#FFCC00', gradient: GRADIENTS.lsg },
];

export const SHADOWS = {
    soft: {
        shadowColor: PALETTE.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 2,
    },
    medium: {
        shadowColor: PALETTE.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    strong: {
        shadowColor: PALETTE.black,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 8,
    },
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    }
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 20, // Refined from 24
    xl: 32,
    xxl: 48,
};

export const BORDER_RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20, // Standard card radius
    xxl: 28, // Run panel radius
    round: 9999,
};

const FONT_FAMILY = 'Inter'; // User requested Inter. Ensure font is linked or fallback to system.
// React Native doesn't bundle Inter by default. 
// If Inter isn't available, we should fallback to system sans-serif.
// Assuming we proceed with 'Inter' as requested, but if it fails to load, iOS/Android use system.

export const TYPOGRAPHY = {
    h1: {
        fontFamily: FONT_FAMILY,
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: 0.5,
    },
    score: {
        fontFamily: FONT_FAMILY,
        fontSize: 52,
        fontWeight: '700' as const,
    },
    h2: {
        fontFamily: FONT_FAMILY,
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 32,
    },
    h3: {
        fontFamily: FONT_FAMILY,
        fontSize: 20,
        fontWeight: '600' as const,
        lineHeight: 28,
    },
    body: {
        fontFamily: FONT_FAMILY,
        fontSize: 15,
        fontWeight: '500' as const,
        lineHeight: 22,
    },
    bodyLarge: {
        fontFamily: FONT_FAMILY,
        fontSize: 17,
        fontWeight: '500' as const,
        lineHeight: 24,
    },
    bodySmall: {
        fontFamily: FONT_FAMILY,
        fontSize: 13,
        fontWeight: '400' as const,
        lineHeight: 18,
    },
    label: {
        fontFamily: FONT_FAMILY,
        fontSize: 14,
        fontWeight: '600' as const,
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
    },
    caption: {
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        fontWeight: '500' as const,
        color: PALETTE.lightTextSecondary, // Default
    },
};

export interface Theme {
    backgroundGradientStart: string;
    backgroundGradientEnd: string;
    surface: string;
    surfaceElevated: string;
    textPrimary: string;
    textSecondary: string;
    accentPrimary: string;
    accentSecondary: string;
    borderSubtle: string;
    runNeutral: string;
    runFour: string;
    runSix: string;
    runWicket: string;
    wideColor: string;
    noBallColor: string;
    shadowColor: string;
    statusBar: 'light-content' | 'dark-content';
    gradientVariant: keyof typeof GRADIENTS;

    // Action Buttons
    overthrowColor: string;
    undoColor: string;
    scoreTextColor: string;
    buttonTextOnPastel: string;

    // Legacy/Compat keys that might still be used
    backgroundPrimary: string;
    backgroundCard: string;
    accent: string;
    borderSoft: string;

    // New Specifics
    runButtonText: string;
}

export const lightTheme: Theme = {
    backgroundGradientStart: PALETTE.lightBackgroundStart,
    backgroundGradientEnd: PALETTE.lightBackgroundEnd,
    surface: PALETTE.lightSurface,
    surfaceElevated: PALETTE.lightSurfaceElevated,
    textPrimary: PALETTE.lightTextPrimary,
    textSecondary: PALETTE.lightTextSecondary,
    accentPrimary: PALETTE.royalBlue,
    accentSecondary: '#60A5FA', // Lighter blue
    borderSubtle: PALETTE.lightBorder,

    runNeutral: PALETTE.runNeutral,
    runFour: PALETTE.runFour,
    runSix: PALETTE.runSix,
    runWicket: PALETTE.runWicket,

    wideColor: PALETTE.pastelSky, // Updated to Pastel Sky
    noBallColor: PALETTE.pastelRed, // Updated to Pastel Red
    overthrowColor: PALETTE.pastelYellow, // New
    undoColor: PALETTE.pastelOrange,      // New
    scoreTextColor: PALETTE.white,        // Always white on gradient
    buttonTextOnPastel: PALETTE.black,    // Always black on pastels
    shadowColor: PALETTE.black,
    statusBar: 'dark-content',
    gradientVariant: 'light',

    // Compat
    backgroundPrimary: PALETTE.lightBackgroundStart,
    backgroundCard: PALETTE.lightSurface,
    accent: PALETTE.royalBlue,
    borderSoft: PALETTE.lightBorder,
    runButtonText: PALETTE.lightTextPrimary, // Dark text on light neutral buttons
};

export const darkTheme: Theme = {
    backgroundGradientStart: PALETTE.darkBackgroundStart,
    backgroundGradientEnd: PALETTE.darkBackgroundEnd,
    surface: PALETTE.darkSurface,
    surfaceElevated: PALETTE.darkSurfaceElevated,
    textPrimary: PALETTE.darkTextPrimary,
    textSecondary: PALETTE.darkTextSecondary,
    accentPrimary: PALETTE.royalBlue,
    accentSecondary: '#60A5FA',
    borderSubtle: PALETTE.darkBorder,

    runNeutral: '#2C2E33', // Darkened neutral
    runFour: PALETTE.runFour,
    runSix: PALETTE.runSix,
    runWicket: PALETTE.runWicket,
    wideColor: PALETTE.pastelSky,
    noBallColor: PALETTE.pastelRed,
    overthrowColor: PALETTE.pastelYellow, // New
    undoColor: PALETTE.pastelOrange,      // New
    scoreTextColor: PALETTE.white,        // Always white on gradient
    buttonTextOnPastel: PALETTE.black,    // Always black on pastels
    shadowColor: '#000000',
    statusBar: 'light-content',
    gradientVariant: 'dark',

    // Compat
    backgroundPrimary: PALETTE.darkBackgroundStart,
    backgroundCard: PALETTE.darkSurface,
    accent: PALETTE.royalBlue,
    borderSoft: PALETTE.darkBorder,
    runButtonText: PALETTE.darkTextPrimary, // White text on dark neutral buttons
};

// Re-export constants
export const COLORS = PALETTE;


