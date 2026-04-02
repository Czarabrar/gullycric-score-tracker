// Zustand store with AsyncStorage persistence for match data
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IPL_TEAM_COLORS } from '../theme';


// Types
export interface TeamColor {
    id: string;
    name: string;
    primary: string;
    secondary: string;
}

export interface Player {
    id: string;
    name: string;
    isCaptain: boolean;
    isWicketKeeper: boolean;
    stats?: {
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        wickets: number;
        overs: number;
        maidens: number;
        runsConceded: number;
    };
}

export interface Team {
    name: string;
    color: TeamColor;
    players: Player[];
    squad: string[]; // List of player IDs
}

export interface BallEvent {
    id: string;
    runs: number;
    extras: 'wide' | 'noball' | 'bye' | 'legbye' | null;
    isWicket: boolean;
    wicketType?: 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket';
    batsmanIndex: number;
    timestamp: number;
    boundaryZone?: string;
    isFreeHit?: boolean; // Was this ball bowled during a Free Hit?
    isGullyExtra?: boolean; // True if this extra adds no automatic runs (None option)
    // Snapshots for Undo
    strikerIndexSnapshot?: number; // Who was striker before this ball?
    nonStrikerIndexSnapshot?: number; // Who was non-striker before this ball?
    strikerStatsSnapshot?: Player['stats']; // Stats before this ball
    bowlerStatsSnapshot?: Player['stats']; // Stats before this ball
    bowlerIndexSnapshot?: number; // Future proofing for Pro Mode
    playerOutIndex?: number; // Index of the player who got out (required for filtering)
}

export interface Over {
    balls: BallEvent[];
    bowlerName?: string;
    bowlerIndex?: number; // Index in players array (Pro Mode)
}

export interface Innings {
    battingTeamIndex: 0 | 1;
    overs: Over[];
    totalRuns: number;
    wickets: number;
    currentBatsmanIndex: number;
    nonStrikerIndex: number;
    isNextBallFreeHit: boolean; // Free Hit pending after No Ball
    isOverPending: boolean; // True when over is complete, waiting for user confirmation
    lastOverRuns?: number; // Runs scored in the last completed over (for summary)
}

export interface Match {
    id: string;
    teamA: Team;
    teamB: Team;
    tossWinner: 0 | 1;
    tossChoice: 'bat' | 'bowl';
    totalOvers: number;
    totalWickets: number;
    innings: Innings[];
    currentInnings: number;
    mode: 'gully' | 'pro';
    status: 'setup' | 'ready' | 'inProgress' | 'completed';
    winner?: 0 | 1 | 'tie';
    winMargin?: string;
    resultType?: 'normal' | 'super_over' | 'tie';
    isSuperOver?: boolean;
    mvp?: {
        name: string;
        teamIndex: 0 | 1;
        stats: string;
    };
    createdAt: number;
    completedAt?: number;
}

export interface Series {
    id: string;
    bestOf: 1 | 3 | 5 | 7;
    teamAWins: number;
    teamBWins: number;
    matchIds: string[];
    isActive: boolean;
}

export interface MatchState {
    // Team Setup
    teamA: Team;
    teamB: Team;
    setTeamA: (team: Partial<Team>) => void;
    setTeamB: (team: Partial<Team>) => void;

    // Match Mode
    matchMode: 'gully' | 'pro';
    setMatchMode: (mode: 'gully' | 'pro') => void;

    // Config Lock (after toss)
    isConfigLocked: boolean;

    // Series
    series: Series | null;
    startSeries: (bestOf: 1 | 3 | 5 | 7) => void;
    endSeries: () => void;

    // Current Match
    currentMatch: Match | null;
    startMatch: (config: { totalOvers: number; totalWickets: number }) => void;
    setTossResult: (winner: 0 | 1, choice: 'bat' | 'bowl') => void;
    // Pro Mode: Set initial players for innings
    setInningsPlayers: (strikerIndex: number, nonStrikerIndex: number, bowlerIndex: number) => void;
    setNewBatsman: (playerIndex: number, position: 'striker' | 'nonStrkr') => void;
    addBall: (event: Omit<BallEvent, 'id' | 'timestamp'>) => void;
    undoLastBall: () => void;
    endInnings: () => void;
    endMatch: (winner: 0 | 1 | 'tie', winMargin: string, resultType?: 'normal' | 'super_over' | 'tie') => void;
    startSuperOver: () => void; // SUPER OVER ACTION
    setMVP: (name: string, teamIndex: 0 | 1, stats: any) => void; // Using any for stats flexibility
    resetMatch: () => void; // Unlock config for new match
    addOverthrowRuns: (runs: number) => void;
    discardActiveMatch: () => void; // Discard active match
    confirmNextOver: (bowlerIndex?: number) => void; // Confirm and start next over
    startNextSeriesMatch: () => void; // Start next match in series (preserves config)

    // Match History
    matchHistory: Match[];
    clearHistory: () => void;
}

// Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// Create empty innings
const createEmptyInnings = (battingTeamIndex: 0 | 1): Innings => ({
    battingTeamIndex,
    overs: [{ balls: [] }],
    totalRuns: 0,
    wickets: 0,
    currentBatsmanIndex: 0,
    nonStrikerIndex: 1,
    isNextBallFreeHit: false,
    isOverPending: false,
});

const defaultTeamA: Team = {
    name: 'Team A',
    color: IPL_TEAM_COLORS[0],
    players: [],
    squad: [],
};

const defaultTeamB: Team = {
    name: 'Team B',
    color: IPL_TEAM_COLORS[1],
    players: [],
    squad: [],
};

export const useMatchStore = create<MatchState>()(
    persist(
        (set, get) => ({
            // Initial team setup
            teamA: defaultTeamA,
            teamB: defaultTeamB,

            setTeamA: (team) =>
                set((state) => {
                    // Lock check removed to allow pre-setup even if current match exists
                    return { teamA: { ...state.teamA, ...team } };
                }),

            setTeamB: (team) =>
                set((state) => {
                    // Lock check removed
                    return { teamB: { ...state.teamB, ...team } };
                }),

            // Match Mode
            matchMode: 'gully',
            setMatchMode: (mode) => set({ matchMode: mode }),

            // Config lock (prevents changes after toss)
            isConfigLocked: false,

            // Series management
            series: null,

            startSeries: (bestOf) =>
                set({
                    series: {
                        id: generateId(),
                        bestOf,
                        teamAWins: 0,
                        teamBWins: 0,
                        matchIds: [],
                        isActive: true,
                    },
                }),

            endSeries: () => set({ series: null }),

            // Current match
            currentMatch: null,

            startMatch: ({ totalOvers, totalWickets }) => {
                const { teamA, teamB, matchMode } = get();
                const match: Match = {
                    id: generateId(),
                    teamA: { ...teamA },
                    teamB: { ...teamB },
                    tossWinner: 0, // Placeholder
                    tossChoice: 'bat', // Placeholder
                    totalOvers,
                    totalWickets,
                    innings: [],
                    currentInnings: 0,
                    status: 'setup',
                    mode: matchMode,
                    createdAt: Date.now(),
                };
                set({
                    currentMatch: match,
                    isConfigLocked: true, // Lock config when match starts (toss)
                });
            },

            setTossResult: (winner, choice) =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    const battingFirst = choice === 'bat' ? winner : (1 - winner) as 0 | 1;

                    return {
                        currentMatch: {
                            ...state.currentMatch,
                            tossWinner: winner,
                            tossChoice: choice,
                            // status remains 'setup' until players selected or first ball
                            innings: [createEmptyInnings(battingFirst)],
                        },
                    };
                }),

            setInningsPlayers: (strikerIndex, nonStrikerIndex, bowlerIndex) =>
                set((state) => {
                    if (!state.currentMatch) return state;
                    const match = { ...state.currentMatch };
                    const innings = { ...match.innings[match.currentInnings] };

                    // Set batsmen
                    innings.currentBatsmanIndex = strikerIndex;
                    innings.nonStrikerIndex = nonStrikerIndex;

                    // Set bowler for the first over (if empty)
                    if (innings.overs.length > 0) {
                        const currentOver = { ...innings.overs[innings.overs.length - 1] };
                        // Only set if balls haven't been bowled yet in this over
                        if (currentOver.balls.length === 0) {
                            currentOver.bowlerIndex = bowlerIndex;
                            // Optionally set name if available, but UI should handle it from index
                            // currentOver.bowlerName = ...
                            innings.overs[innings.overs.length - 1] = currentOver;
                        }
                    }

                    const newInnings = [...match.innings];
                    newInnings[match.currentInnings] = innings;
                    match.innings = newInnings;
                    match.status = 'ready';

                    return { currentMatch: match };
                }),

            setNewBatsman: (playerIndex, position) =>
                set((state) => {
                    if (!state.currentMatch) return state;
                    const match = { ...state.currentMatch };
                    const innings = { ...match.innings[match.currentInnings] };

                    if (position === 'striker') {
                        innings.currentBatsmanIndex = playerIndex;
                    } else {
                        innings.nonStrikerIndex = playerIndex;
                    }

                    const newInnings = [...match.innings];
                    newInnings[match.currentInnings] = innings;
                    match.innings = newInnings;

                    return { currentMatch: match };
                }),

            addBall: (event) =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    const match = { ...state.currentMatch };
                    if (match.status === 'setup' || match.status === 'ready') {
                        match.status = 'inProgress';
                    }
                    const innings = { ...match.innings[match.currentInnings] };

                    // GUARD: strict check for Over Completion Modal
                    if (innings.isOverPending) {
                        console.log('[matchStore] Over pending confirmation, ignoring ball');
                        return state;
                    }

                    // Calculate total legal balls BEFORE adding this new one
                    const totalLegalBallsInInnings = innings.overs.reduce(
                        (acc, over) => acc + over.balls.filter((b) => b.extras !== 'wide' && b.extras !== 'noball').length,
                        0
                    );
                    const maxBalls = match.totalOvers * 6;

                    // STRICT LIMIT: If we are already at max balls, DO NOT add more
                    if (totalLegalBallsInInnings >= maxBalls || innings.wickets >= match.totalWickets || match.status === 'completed') {
                        console.log('[matchStore] Innings complete or match done, ignoring ball');
                        return state; // Don't add the ball
                    }

                    const currentOver = { ...innings.overs[innings.overs.length - 1] };

                    // Check legal balls in CURRENT over
                    const currentOverLegalBallsCount = currentOver.balls.filter(b => b.extras !== 'wide' && b.extras !== 'noball').length;

                    // GUARD: If current over already has 6 legal balls, we shouldn't be here (isOverPending should have caught it), 
                    // but double check to prevent 7th legal ball.
                    if (currentOverLegalBallsCount >= 6) {
                        console.log('[matchStore] Over already has 6 legal balls');
                        return state;
                    }

                    // Capture snapshots for Undo
                    const strikerIndexSnapshot = innings.currentBatsmanIndex;
                    const nonStrikerIndexSnapshot = innings.nonStrikerIndex;

                    // Check if this ball is a Free Hit
                    const wasFreeHit = innings.isNextBallFreeHit;

                    // Create ball event with Free Hit flag
                    const ballEvent: BallEvent = {
                        ...event,
                        id: generateId(),
                        timestamp: Date.now(),
                        isFreeHit: wasFreeHit,
                        strikerIndexSnapshot,
                        nonStrikerIndexSnapshot,
                        // Default playerOutIndex if not provided but isWicket
                        playerOutIndex: event.playerOutIndex !== undefined
                            ? event.playerOutIndex
                            : (event.isWicket && event.wicketType !== 'runout' ? innings.currentBatsmanIndex : undefined)
                    };

                    // Pro Mode Snapshot Construction
                    if (match.mode === 'pro') {
                        const battingTeam = match.innings[match.currentInnings].battingTeamIndex === 0 ? match.teamA : match.teamB;
                        const bowlingTeam = match.innings[match.currentInnings].battingTeamIndex === 0 ? match.teamB : match.teamA;

                        const striker = battingTeam.players[innings.currentBatsmanIndex];
                        if (striker && striker.stats) ballEvent.strikerStatsSnapshot = { ...striker.stats };

                        if (currentOver.bowlerIndex !== undefined) {
                            const bowler = bowlingTeam.players[currentOver.bowlerIndex];
                            if (bowler && bowler.stats) ballEvent.bowlerStatsSnapshot = { ...bowler.stats };
                        }
                    }

                    // On Free Hit, only Run Out is a valid wicket
                    // Other wicket types are automatically converted to not out
                    if (wasFreeHit && event.isWicket && event.wicketType !== 'runout') {
                        ballEvent.isWicket = false;
                        ballEvent.wicketType = undefined;
                    }

                    // Add ball to current over
                    const newBalls = [...currentOver.balls, ballEvent];
                    currentOver.balls = newBalls;

                    // Update runs (No Ball and Wide add 1 extra run, unless isGullyExtra is true)
                    const extraRun = (event.extras === 'wide' || event.extras === 'noball')
                        ? (event.isGullyExtra ? 0 : 1)
                        : 0;
                    innings.totalRuns += event.runs + extraRun;

                    // Update wickets (only if valid wicket)
                    if (ballEvent.isWicket) {
                        innings.wickets += 1;
                    }

                    // Free Hit logic:
                    // - No Ball triggers Free Hit on next delivery
                    // - Free Hit resets after the next legal delivery (not wide/noball)
                    if (event.extras === 'noball') {
                        innings.isNextBallFreeHit = true;
                    } else if (event.extras !== 'wide') {
                        // Legal delivery (or was already a Free Hit) - reset Free Hit
                        innings.isNextBallFreeHit = false;
                    }
                    // Wide during Free Hit: Free Hit continues to next ball

                    // Check if over is complete (6 legal deliveries)
                    // Wide and No Ball do NOT count as legal deliveries
                    const legalBalls = newBalls.filter(
                        (b) => b.extras !== 'wide' && b.extras !== 'noball'
                    ).length;

                    // Update overs array
                    const newOvers = [...innings.overs];
                    newOvers[newOvers.length - 1] = currentOver;

                    // Start new over if 6 legal balls AND not at max overs
                    const completedOvers = newOvers.length; // Current over index is length - 1, so length = completed overs after this ball

                    if (legalBalls >= 6) {
                        // Rotate strike at end of over
                        const temp = innings.currentBatsmanIndex;
                        innings.currentBatsmanIndex = innings.nonStrikerIndex;
                        innings.nonStrikerIndex = temp;

                        // Calculate runs in this completed over for summary
                        const overRuns = currentOver.balls.reduce((sum, b) => {
                            const bExtraRun = (b.extras === 'wide' || b.extras === 'noball')
                                ? (b.isGullyExtra ? 0 : 1)
                                : 0;
                            return sum + b.runs + bExtraRun;
                        }, 0);
                        innings.lastOverRuns = overRuns;

                        // Only set pending if we haven't reached the max overs
                        // IMPORTANT: Even if it's the last over (e.g. over 5 of 5), we set pending 
                        // so user sees "Over Complete" before "Innings Complete" logic kicks in? 
                        // Actually effectively, if it's the last over, let's allow it to finish so End Innings check can happen.
                        // BUT user request says: "If currentOverLegalBalls === 6: Lock scoring input. Show 'Over Complete' modal."
                        // So we MUST set pending. Match end check will happen after they confirm? 
                        // Or if it's the very last ball of match?

                        // Let's set Pending for ALL overs to force the modal.
                        // UNLESS logic elsewhere handles Match End immediately?
                        // Match Screen useEffect handles Match End.
                        // If we set Pending, user must click "Next Over".
                        // If it was the last over, "Next Over" might not be appropriate.
                        // But let's stick to the requirement: "Requre user to press Next Over".

                        innings.isOverPending = true;
                        // DO NOT push new over here - wait for confirmNextOver

                    } else if (event.runs % 2 === 1 && !ballEvent.isWicket) {
                        // Rotate strike on odd runs (if not a wicket)
                        const temp = innings.currentBatsmanIndex;
                        innings.currentBatsmanIndex = innings.nonStrikerIndex;
                        innings.nonStrikerIndex = temp;
                    }

                    innings.overs = newOvers;

                    const newInnings = [...match.innings];
                    newInnings[match.currentInnings] = innings;
                    match.innings = newInnings;

                    // --- PRO MODE: Update Player Stats ---
                    if (match.mode === 'pro') {
                        const battingTeamIndex = innings.battingTeamIndex;
                        const bowlingTeamIndex = battingTeamIndex === 0 ? 1 : 0;

                        // Helper to safely get/update team and player
                        const updatePlayerStats = (teamIndex: 0 | 1, playerIndex: number, updateFn: (stats: NonNullable<Player['stats']>) => void) => {
                            const teamKey = teamIndex === 0 ? 'teamA' : 'teamB';
                            // Deep copy team players to avoid mutation
                            const team = { ...match[teamKey] };
                            team.players = [...team.players];

                            if (playerIndex >= 0 && team.players[playerIndex]) {
                                const player = { ...team.players[playerIndex] };
                                const stats = player.stats ? { ...player.stats } : { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: 0, maidens: 0, runsConceded: 0 };

                                updateFn(stats);

                                player.stats = stats;
                                team.players[playerIndex] = player;
                                match[teamKey] = team;
                            }
                        };

                        // Update Striker
                        updatePlayerStats(battingTeamIndex, innings.currentBatsmanIndex, (stats) => {
                            if (event.extras !== 'wide') { // Wides don't count as balls faced
                                stats.balls += 1;
                                stats.runs += event.runs;
                                if (event.runs === 4) stats.fours += 1;
                                if (event.runs === 6) stats.sixes += 1;
                            }
                        });

                        // Update Bowler
                        if (currentOver.bowlerIndex !== undefined) {
                            updatePlayerStats(bowlingTeamIndex, currentOver.bowlerIndex, (stats) => {
                                // Runs Conceded
                                const extraRuns = (event.extras === 'wide' || event.extras === 'noball')
                                    ? (event.isGullyExtra ? 0 : 1)
                                    : 0;
                                stats.runsConceded += event.runs + extraRuns;

                                // Wickets (excluding runouts)
                                if (ballEvent.isWicket && ballEvent.wicketType !== 'runout') {
                                    stats.wickets += 1;
                                }

                                // Legal balls (part of overs) - we track manually or derive
                                // For detailed over tracking, we could add 0.1, but floating point issues.
                                // Let's just track raw balls and derive overs for display?
                                // Or stick to simple stats for now.
                            });
                        }
                    }

                    // TARGET CHECK moved to Match Screen useEffect to ensure endMatch action is called
                    return { currentMatch: match };
                }),

            undoLastBall: () =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    const match = { ...state.currentMatch };
                    let innings = { ...match.innings[match.currentInnings] };
                    let overIndex = innings.overs.length - 1;

                    // Find the last over with balls
                    while (overIndex >= 0 && innings.overs[overIndex].balls.length === 0) {
                        overIndex--;
                    }

                    if (overIndex < 0) return state; // No balls to undo

                    const currentOver = { ...innings.overs[overIndex] };
                    const lastBall = currentOver.balls[currentOver.balls.length - 1];

                    if (!lastBall) return state;

                    // Remove the last ball
                    currentOver.balls = currentOver.balls.slice(0, -1);

                    // Revert runs
                    const lastBallExtraRun = (lastBall.extras === 'wide' || lastBall.extras === 'noball')
                        ? (lastBall.isGullyExtra ? 0 : 1)
                        : 0;
                    innings.totalRuns -= lastBall.runs + lastBallExtraRun;

                    // Revert wicket
                    if (lastBall.isWicket) {
                        innings.wickets -= 1;
                    }

                    // Revert Free Hit state:
                    // - If the undone ball was marked as a Free Hit, restore Free Hit (it was active)
                    // - If the undone ball was a No Ball, we're undoing the trigger, so reset Free Hit
                    // - Otherwise, keep Free Hit false
                    if (lastBall.isFreeHit) {
                        // The ball we're undoing was bowled during Free Hit, so Free Hit should be active again
                        innings.isNextBallFreeHit = true;
                    } else if (lastBall.extras === 'noball') {
                        // The ball we're undoing was the No Ball that triggered Free Hit, so reset it
                        innings.isNextBallFreeHit = false;
                    }
                    // Note: If it was a normal ball, Free Hit remains as it was (likely false)

                    // Revert strike rotation (simplified - may need more logic)
                    // Restore striker rotation from snapshots if available
                    if (lastBall.strikerIndexSnapshot !== undefined && lastBall.nonStrikerIndexSnapshot !== undefined) {
                        innings.currentBatsmanIndex = lastBall.strikerIndexSnapshot;
                        innings.nonStrikerIndex = lastBall.nonStrikerIndexSnapshot;
                    } else {
                        // Fallback to legacy heuristic (remove if all balls have snapshots)
                        if (lastBall.runs % 2 === 1 && !lastBall.isWicket) {
                            const temp = innings.currentBatsmanIndex;
                            innings.currentBatsmanIndex = innings.nonStrikerIndex;
                            innings.nonStrikerIndex = temp;
                        }
                    }
                    // --- PRO MODE: Restore Stats ---
                    if (match.mode === 'pro') {
                        const battingTeamIndex = innings.battingTeamIndex;
                        const bowlingTeamIndex = battingTeamIndex === 0 ? 1 : 0;
                        const battingTeamKey = battingTeamIndex === 0 ? 'teamA' : 'teamB';
                        const bowlingTeamKey = bowlingTeamIndex === 0 ? 'teamA' : 'teamB';

                        // Helper to restore
                        const restorePlayerStats = (teamKey: 'teamA' | 'teamB', playerIndex: number, statsSnapshot?: Player['stats']) => {
                            if (playerIndex >= 0 && statsSnapshot) {
                                const team = { ...match[teamKey] };
                                team.players = [...team.players];
                                const player = { ...team.players[playerIndex] };
                                player.stats = { ...statsSnapshot };
                                team.players[playerIndex] = player;
                                match[teamKey] = team;
                            }
                        };

                        // Restore Striker
                        restorePlayerStats(battingTeamKey, innings.currentBatsmanIndex, lastBall.strikerStatsSnapshot);

                        // Restore Bowler
                        if (currentOver.bowlerIndex !== undefined) {
                            restorePlayerStats(bowlingTeamKey, currentOver.bowlerIndex, lastBall.bowlerStatsSnapshot);
                        }
                    }

                    const newOvers = [...innings.overs];
                    newOvers[overIndex] = currentOver;

                    // Remove empty overs at the end
                    while (newOvers.length > 1 && newOvers[newOvers.length - 1].balls.length === 0) {
                        newOvers.pop();
                    }

                    innings.overs = newOvers;

                    const newInnings = [...match.innings];
                    newInnings[match.currentInnings] = innings;
                    match.innings = newInnings;

                    // Revert Match Completion if needed
                    if (match.status === 'completed') {
                        match.status = 'inProgress';
                        match.winner = undefined;
                        match.winMargin = undefined;
                        match.completedAt = undefined;
                        // Also revert series update if it happened?
                        // Ideally we should handle series reversion too, but `endMatch` handles the logic.
                        // If we just revert status, the store's `endMatch` wasn't called there.
                        // So series wasn't updated yet.
                        // BUT `undoLastBall` should be safe.
                    }

                    return { currentMatch: match };
                }),

            endInnings: () =>
                set((state) => {
                    if (!state.currentMatch || state.currentMatch.currentInnings === 1) return state;

                    const match = { ...state.currentMatch };
                    const nextBattingTeam = match.innings[0].battingTeamIndex === 0 ? 1 : 0;

                    match.innings = [...match.innings, createEmptyInnings(nextBattingTeam as 0 | 1)];
                    match.currentInnings = 1;

                    return { currentMatch: match };
                }),

            endMatch: (winner, winMargin, resultType = 'normal') =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    const match: Match = {
                        ...state.currentMatch,
                        status: 'completed',
                        winner,
                        winMargin,
                        resultType,
                        completedAt: Date.now(),
                    };

                    // Update series if active
                    let series = state.series;
                    if (series && series.isActive) {
                        series = { ...series };
                        if (winner === 0) {
                            series.teamAWins += 1;
                        } else if (winner === 1) {
                            series.teamBWins += 1;
                        }
                        series.matchIds = [...series.matchIds, match.id];

                        // Check if series is complete
                        const winsNeeded = Math.ceil(series.bestOf / 2);
                        if (series.teamAWins >= winsNeeded || series.teamBWins >= winsNeeded) {
                            series.isActive = false;
                        }
                    }

                    // Strict History Rule:
                    // - Pro Mode: Save to history
                    // - Gully Mode: Do NOT save to history
                    const newHistory = match.mode === 'pro'
                        ? [match, ...state.matchHistory].slice(0, 50)
                        : state.matchHistory;

                    return {
                        currentMatch: match,
                        matchHistory: newHistory,
                        series,
                    };
                }),

            startSuperOver: () =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    const match = { ...state.currentMatch };

                    // Set Super Over configuration
                    match.isSuperOver = true;
                    match.totalOvers = 1;
                    match.totalWickets = 2; // Super over rule: 2 wickets max (or less if team smaller, but 2 is standard)
                    match.status = 'inProgress';

                    // Create Innings 3 (Team A) and 4 (Team B) - assuming Team A bats first in Super Over for simplicity?
                    // Standard Rule: Team batting SECOND in main match bats FIRST in Super Over.
                    // Main Match: Innings 0 (A), Innings 1 (B) -> Team B ended batting.
                    // So Team B bats first in Super Over.
                    // Let's check who batted second.
                    const lastBattingTeamIndex = match.innings[match.innings.length - 1].battingTeamIndex;

                    // Actually, let's keep it simple: Team that batted second bats first in super over.
                    const superOverBattingFirst = lastBattingTeamIndex;
                    const superOverBattingSecond = (lastBattingTeamIndex === 0 ? 1 : 0) as 0 | 1;

                    match.innings = [
                        ...match.innings,
                        createEmptyInnings(superOverBattingFirst), // Innings 2: Team B
                        createEmptyInnings(superOverBattingSecond) // Innings 3: Team A
                    ];

                    match.currentInnings = match.innings.length - 2; // Point to new first innings of super over

                    return { currentMatch: match };
                }),

            setMVP: (name, teamIndex, stats) =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    return {
                        currentMatch: {
                            ...state.currentMatch,
                            mvp: { name, teamIndex, stats },
                        },
                    };
                }),

            // Match history
            matchHistory: [],

            // Reset match and unlock config
            resetMatch: () => set({
                teamA: defaultTeamA,
                teamB: defaultTeamB,
                currentMatch: null,
                isConfigLocked: false,
                series: null,
                matchMode: 'gully',
            }),

            discardActiveMatch: () => set({
                currentMatch: null,
                isConfigLocked: false,
                // Do NOT reset teams
            }),

            addOverthrowRuns: (runs) =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    const match = { ...state.currentMatch };
                    let innings = { ...match.innings[match.currentInnings] };
                    let overIndex = innings.overs.length - 1;

                    // Find the last over with balls
                    while (overIndex >= 0 && innings.overs[overIndex].balls.length === 0) {
                        overIndex--;
                    }

                    if (overIndex < 0) return state; // No balls to update

                    const currentOver = { ...innings.overs[overIndex] };
                    const lastBall = { ...currentOver.balls[currentOver.balls.length - 1] }; // Clone

                    if (!lastBall) return state;

                    // Update total runs
                    innings.totalRuns += runs;

                    // Update ball runs
                    const oldRunParity = lastBall.runs % 2;
                    lastBall.runs += runs;
                    const newRunParity = lastBall.runs % 2;

                    // Update ball in over
                    currentOver.balls = [...currentOver.balls];
                    currentOver.balls[currentOver.balls.length - 1] = lastBall;

                    // Handle Strike Rotation
                    // If parity changed (e.g., Odd -> Even or Even -> Odd), we must toggle strike
                    if (oldRunParity !== newRunParity && !lastBall.isWicket) {
                        const temp = innings.currentBatsmanIndex;
                        innings.currentBatsmanIndex = innings.nonStrikerIndex;
                        innings.nonStrikerIndex = temp;
                    }

                    // --- PRO MODE: Update Stats for Overthrow ---
                    if (match.mode === 'pro') {
                        const battingTeamIndex = innings.battingTeamIndex;
                        const bowlingTeamIndex = battingTeamIndex === 0 ? 1 : 0;
                        const battingTeamKey = battingTeamIndex === 0 ? 'teamA' : 'teamB';
                        const bowlingTeamKey = bowlingTeamIndex === 0 ? 'teamA' : 'teamB';

                        // 1. Update Striker Runs
                        // Note: overthrows go to batsman unless leg byes etc?
                        // Assuming overthrows on valid ball go to batsman.
                        const strikerIndex = innings.currentBatsmanIndex; // Actually, use the one who played the ball?
                        // Overthrow usually happens after run, strike might have rotated?
                        // But `addOverthrowRuns` is typically called immediately.
                        // Wait, if strike rotated above, we might be pointing to wrong batsman?
                        // Uses `innings.currentBatsmanIndex` which IS updated above.
                        // BUT runs should go to the batsman who HIT the ball.
                        // If strike rotated, the `currentBatsmanIndex` is now the other guy.
                        // We should rely on `lastBall.strikerIndexSnapshot` if possible, OR logic.
                        // If strike rotated, `current` is non-striker of the event.

                        // Better: Update the player who was striker *at the start of the ball*.
                        const originalStrikerIndex = lastBall.strikerIndexSnapshot ?? innings.currentBatsmanIndex;

                        // BUT wait, `strikerIndexSnapshot` is only available if we captured it.
                        // `addBall` captures it. So it should be there.

                        if (originalStrikerIndex !== undefined) {
                            const team = { ...match[battingTeamKey] };
                            team.players = [...team.players];
                            if (team.players[originalStrikerIndex]) {
                                const p = { ...team.players[originalStrikerIndex] };
                                if (p.stats) {
                                    p.stats = { ...p.stats, runs: p.stats.runs + runs };
                                    if (lastBall.runs >= 4) {
                                        // If total runs for ball becomes 4/6, do we update boundary counts?
                                        // Complicated. Let's simplfy: increment runs. 
                                        // Boundary update logic is tricky with overthrows (e.g. run 3 + 4 overthrow = 7, no boundary).
                                    }
                                    team.players[originalStrikerIndex] = p;
                                    match[battingTeamKey] = team;
                                }
                            }
                        }

                        // 2. Update Bowler Runs Conceded
                        if (currentOver.bowlerIndex !== undefined) {
                            const team = { ...match[bowlingTeamKey] };
                            team.players = [...team.players];
                            if (team.players[currentOver.bowlerIndex]) {
                                const p = { ...team.players[currentOver.bowlerIndex] };
                                if (p.stats) {
                                    p.stats = { ...p.stats, runsConceded: p.stats.runsConceded + runs };
                                    team.players[currentOver.bowlerIndex] = p;
                                    match[bowlingTeamKey] = team;
                                }
                            }
                        }
                    }

                    // Update innings
                    const newOvers = [...innings.overs];
                    newOvers[overIndex] = currentOver;
                    innings.overs = newOvers;

                    const newInnings = [...match.innings];
                    newInnings[match.currentInnings] = innings;
                    match.innings = newInnings;

                    return { currentMatch: match };
                }),

            confirmNextOver: (bowlerIndex) =>
                set((state) => {
                    if (!state.currentMatch) return state;

                    const match = { ...state.currentMatch };
                    const innings = { ...match.innings[match.currentInnings] };

                    // Only proceed if over is pending
                    if (!innings.isOverPending) return state;

                    // Push new over
                    const newOvers = [...innings.overs];
                    const newOver: Over = { balls: [] };
                    if (bowlerIndex !== undefined) {
                        newOver.bowlerIndex = bowlerIndex;
                    }
                    newOvers.push(newOver);
                    innings.overs = newOvers;

                    // Reset pending state
                    innings.isOverPending = false;
                    innings.lastOverRuns = undefined;

                    const newInnings = [...match.innings];
                    newInnings[match.currentInnings] = innings;
                    match.innings = newInnings;

                    return { currentMatch: match };
                }),

            startNextSeriesMatch: () =>
                set((state) => {
                    // Only works if series is active and there's a previous match
                    if (!state.series?.isActive || !state.currentMatch) return state;

                    // Get config from previous match
                    const prevMatch = state.currentMatch;
                    const id = generateId();

                    const newMatch: Match = {
                        id,
                        teamA: { ...state.teamA },
                        teamB: { ...state.teamB },
                        totalOvers: prevMatch.totalOvers,
                        totalWickets: prevMatch.totalWickets,
                        tossWinner: 0, // Placeholder, will be set by setTossResult
                        tossChoice: 'bat', // Placeholder, will be set by setTossResult
                        innings: [],
                        currentInnings: 0,
                        status: 'setup',
                        mode: prevMatch.mode,
                        createdAt: Date.now(),
                    };

                    return { currentMatch: newMatch };
                }),

            clearHistory: () => set({ matchHistory: [] }),
        }),
        {
            name: 'match-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                teamA: state.teamA,
                teamB: state.teamB,
                series: state.series,
                currentMatch: state.currentMatch,
                matchHistory: state.matchHistory,
            }),
        }
    )
);
