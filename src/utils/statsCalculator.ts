import { Match, Player, Innings, BallEvent } from '../store/matchStore';

export interface DetailedPlayerStats {
    id: string;
    name: string;
    // Batting
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: string;
    isBatting: boolean; // Currently at crease
    status: 'dnb' | 'notout' | 'out';
    dismissal?: string;
    // Bowling
    overs: string; // "3.2"
    ballsBowled: number;
    maidens: number;
    runsConceded: number;
    wickets: number;
    economy: string;
    // MVP
    mvpPoints: number;
}

export interface TeamStats {
    teamName: string;
    players: DetailedPlayerStats[];
    totalRuns: number;
    wicketsLost: number;
    oversPlayed: string;
    extras: number;
}

// Points System
const POINTS = {
    RUN: 1,
    FOUR_BONUS: 1,
    SIX_BONUS: 2,
    WICKET: 25,
    DOT_BALL: 1,
    MAIDEN: 20,
    DUCK: -5, // Optional
};

export const calculateFantasyPoints = (player: DetailedPlayerStats): number => {
    let points = 0;

    // Batting
    points += player.runs * POINTS.RUN;
    points += player.fours * POINTS.FOUR_BONUS;
    points += player.sixes * POINTS.SIX_BONUS;
    if (player.runs === 0 && player.status === 'out' && player.balls > 0) {
        points += POINTS.DUCK;
    }

    // Bowling
    points += player.wickets * POINTS.WICKET;
    // Dot balls not explicitly tracked in player stats, need ball-by-ball analysis usually.
    // For now, simple approximation or rely on detailed analysis below.
    points += player.maidens * POINTS.MAIDEN;

    return points;
};

export const getMatchStats = (match: Match) => {
    if (!match) return null;

    const teamAStats = processTeamStats(match, 0);
    const teamBStats = processTeamStats(match, 1);

    // Calculate MVP
    const allPlayers = [...teamAStats.players, ...teamBStats.players];
    const mvp = allPlayers.reduce((prev, current) =>
        (current.mvpPoints > prev.mvpPoints) ? current : prev
        , allPlayers[0]);

    return {
        teamA: teamAStats,
        teamB: teamBStats,
        mvp
    };
};

const processTeamStats = (match: Match, teamIndex: 0 | 1): TeamStats => {
    const isTeamA = teamIndex === 0;
    const team = isTeamA ? match.teamA : match.teamB;
    const teamName = team.name;

    // Batting Innings for this team
    // Team A bats in innings[0] (if toss won & bat or lost & field?) -> No, depends on toss.
    // match.innings[0].battingTeamIndex tells us who batted first.

    let battingInnings: Innings | undefined;
    let bowlingInnings: Innings | undefined;

    // Find innings
    for (const inn of match.innings) {
        if (inn.battingTeamIndex === teamIndex) {
            battingInnings = inn;
        } else {
            bowlingInnings = inn;
        }
    }

    const playerStatsMap = new Map<string, DetailedPlayerStats>();

    // Initialize all players
    team.players.forEach(p => {
        playerStatsMap.set(p.id, {
            id: p.id,
            name: p.name,
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            strikeRate: '0.00',
            isBatting: false,
            status: 'dnb',
            dismissal: undefined,
            overs: '0.0',
            ballsBowled: 0,
            maidens: 0,
            runsConceded: 0,
            wickets: 0,
            economy: '0.00',
            mvpPoints: 0
        });
    });

    // 1. Process Batting (from battingInnings)
    if (battingInnings) {
        // Iterate stored stats (striker updates)
        // Actually, matchStore.ts updates player.stats in the team object.
        // We can just use that, but we need to derive "out" status and dismissal from balls?
        // matchStore updates stats cumulatively. 
        // But "out" status is not in stats.

        // We must reconstruct from BallEvents to be precise about "out" and "dnb"
        // OR rely on player.stats + check if out.

        // Let's use player.stats for counts, and ball events for Wickets/Maidens

        team.players.forEach((p, idx) => {
            const stats = p.stats;
            const pStat = playerStatsMap.get(p.id)!;

            if (stats) {
                pStat.runs = stats.runs;
                pStat.balls = stats.balls;
                pStat.fours = stats.fours;
                pStat.sixes = stats.sixes;
                pStat.strikeRate = stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : '0.00';
                if (stats.balls > 0 || stats.runs > 0) pStat.status = 'notout'; // Tentative
            }

            // Check if out
            // Need to iterate innings balls to see if this player was dismissed?
            // Or maintain a 'wickets' list in innings? Innings has 'wickets' count but not who.
            // BallEvent has `isWicket` and `batsmanIndex`.
        });

        // Determine Dismissals
        battingInnings.overs.forEach(over => {
            over.balls.forEach(ball => {
                if (ball.isWicket && ball.batsmanIndex !== undefined) {
                    const dismissedPlayer = team.players[ball.batsmanIndex];
                    if (dismissedPlayer) {
                        const pStat = playerStatsMap.get(dismissedPlayer.id);
                        if (pStat) {
                            pStat.status = 'out';
                            const type = ball.wicketType === 'runout' ? 'Run Out' :
                                ball.wicketType === 'bowled' ? 'b Bowler' : // Need bowler name
                                    ball.wicketType === 'caught' ? 'c Fielder b Bowler' :
                                        ball.wicketType || 'Out';
                            pStat.dismissal = type;
                        }
                    }
                }
            });
        });

        // Check current batsmen
        const striker = team.players[battingInnings.currentBatsmanIndex];
        const nonStriker = team.players[battingInnings.nonStrikerIndex];
        if (striker) playerStatsMap.get(striker.id)!.isBatting = true;
        if (nonStriker) playerStatsMap.get(nonStriker.id)!.isBatting = true;
    }

    // 2. Process Bowling (from bowlingInnings)
    if (bowlingInnings) {
        // We must derive bowling stats from bowlingInnings (where this team bowled)
        // bowlingInnings.overs contains the overs bowled by this team.

        const bowlerBallsMap = new Map<number, BallEvent[]>(); // Bowler Index -> Balls

        bowlingInnings.overs.forEach(over => {
            if (over.bowlerIndex !== undefined) {
                const currentBalls = bowlerBallsMap.get(over.bowlerIndex) || [];
                // Only count legal balls for overs count?
                // Or store all balls to calc runs conceded.
                bowlerBallsMap.set(over.bowlerIndex, [...currentBalls, ...over.balls]);
            }
        });

        bowlerBallsMap.forEach((balls, bowlerIndex) => {
            const bowler = team.players[bowlerIndex];
            if (!bowler) return;

            const pStat = playerStatsMap.get(bowler.id)!;

            let legalBalls = 0;
            let runs = 0;
            let wickets = 0;
            let dots = 0;

            balls.forEach(b => {
                const isLegal = b.extras !== 'wide' && b.extras !== 'noball';
                if (isLegal) legalBalls++;

                // Runs Conceded
                const extraRun = (b.extras === 'wide' || b.extras === 'noball') ? (b.isGullyExtra ? 0 : 1) : 0;
                runs += b.runs + extraRun;

                // Wickets (exclude runout)
                if (b.isWicket && b.wicketType !== 'runout') {
                    wickets++;
                }

                // Dot ball (runs=0, no extras) - purely from bowler pov
                if (b.runs === 0 && !b.extras) {
                    dots++;
                }
            });

            // Maiden calculation (approximation: group by overs)
            // Need to regroup by actual overs to check maidens

            pStat.ballsBowled = legalBalls;
            const completedOvers = Math.floor(legalBalls / 6);
            const ballsRem = legalBalls % 6;
            pStat.overs = `${completedOvers}.${ballsRem}`;
            pStat.runsConceded = runs;
            pStat.wickets = wickets;
            pStat.economy = legalBalls > 0 ? ((runs / legalBalls) * 6).toFixed(2) : '0.00';

            // MVP Points for Bowling
            pStat.mvpPoints += wickets * POINTS.WICKET;
            pStat.mvpPoints += dots * POINTS.DOT_BALL;
        });
    }

    // Calc MVP Batting Points
    playerStatsMap.forEach(p => {
        p.mvpPoints += calculateFantasyPoints(p);
    });

    return {
        teamName,
        players: Array.from(playerStatsMap.values()),
        totalRuns: battingInnings?.totalRuns || 0,
        wicketsLost: battingInnings?.wickets || 0,
        oversPlayed: battingInnings ?
            `${Math.floor((battingInnings.overs.length * 6) / 6)}.${0}` : '0.0', // Rough approx, refine if needed
        extras: 0 // Need to sum extras
    };
};
