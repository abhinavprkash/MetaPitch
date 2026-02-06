import { FIELD_LENGTH, GOAL_WIDTH, FIELD_HALF_WIDTH } from '../constants.js';
const NUM_SIMS = 20;
const HORIZON = 30; // 3 seconds forward
const KL_PIVOT_THRESHOLD = 0.05;
const TOP_PIVOTAL = 5;
/** Add gaussian noise to a value */
function jitter(val, scale) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    return val + z * scale;
}
/** Build SimulationInput from a CanonicalPlay at a given frame */
function buildSimInput(play, frameIdx, noiseScale = 0) {
    const frame = play.frames[frameIdx];
    const prevFrame = frameIdx > 0 ? play.frames[frameIdx - 1] : null;
    const DT = 0.1;
    const state = {};
    for (const [id, info] of Object.entries(play.players)) {
        const pos = frame.positions[id];
        if (!pos)
            continue;
        // Estimate velocity if missing
        let vel = [0, 0];
        if (frame.velocities[id]) {
            vel = frame.velocities[id];
        }
        else if (prevFrame) {
            const prevPos = prevFrame.positions[id];
            if (prevPos) {
                vel = [(pos[0] - prevPos[0]) / DT, (pos[1] - prevPos[1]) / DT];
            }
        }
        state[id] = {
            pos: noiseScale > 0
                ? [jitter(pos[0], noiseScale), jitter(pos[1], noiseScale)]
                : [...pos],
            vel: noiseScale > 0
                ? [jitter(vel[0], noiseScale * 0.5), jitter(vel[1], noiseScale * 0.5)]
                : [...vel],
            ori: frame.orientations[id] ?? 0,
            team: info.team,
            role: info.position,
        };
    }
    return {
        gameId: play.gameId,
        playId: play.playId,
        frameId: frame.id,
        horizon: HORIZON,
        state,
        players: play.players,
    };
}
/** Determine outcome bucket for soccer simulation */
function classifyOutcome(simResult, startBallX, attackingTeam) {
    const lastFrame = simResult.frames[simResult.frames.length - 1];
    if (!lastFrame)
        return { xG: 0, bucket: 'retention' };
    const ballPos = lastFrame.positions['ball'];
    if (!ballPos)
        return { xG: 0, bucket: 'retention' };
    const [x, y] = ballPos;
    // 1. Goal Check
    // Home attacks positive X (105), Away attacks negative X (0) ?? 
    // Wait, standard is simpler if we align everything to attacking right.
    // Assumed: Attacking team attacks x=FIELD_LENGTH
    // If attackingTeam is away, we should flip or assume coordinates are already normalized?
    // Let's assume absolute coordinates for now. Home -> 105.
    const isHomeAttacking = attackingTeam === 'home';
    const targetX = isHomeAttacking ? FIELD_LENGTH : 0;
    // Goal width check (y centered at FIELD_HALF_WIDTH)
    const dy = Math.abs(y - FIELD_HALF_WIDTH);
    const inGoalY = dy < (GOAL_WIDTH / 2);
    const inGoalX = isHomeAttacking ? (x >= 105) : (x <= 0);
    if (inGoalX && inGoalY) {
        return { xG: 1.0, bucket: 'goal' };
    }
    // 2. Turnover Check (closest player)
    let closestDist = Infinity;
    let closestTeam = '';
    for (const [pid, pos] of Object.entries(lastFrame.positions)) {
        if (pid === 'ball')
            continue;
        const team = simResult.players[pid]?.team;
        if (!team)
            continue;
        const d = Math.hypot(pos[0] - x, pos[1] - y);
        if (d < closestDist) {
            closestDist = d;
            closestTeam = team;
        }
    }
    // If closest player is opponent and close (<2m), it's a turnover
    if (closestTeam && closestTeam !== attackingTeam && closestDist < 2.0) {
        return { xG: 0, bucket: 'turnover' };
    }
    // 3. Opportunity (Shot/Key Pass area)
    // Deep in opponent half, central area
    const distToGoal = Math.hypot(targetX - x, dy);
    if (distToGoal < 20) {
        return { xG: 0.15, bucket: 'opportunity' };
    }
    // 4. Progression vs Retention
    const forwardDist = isHomeAttacking ? (x - startBallX) : (startBallX - x);
    if (forwardDist > 10) {
        return { xG: 0.05, bucket: 'progression' };
    }
    return { xG: 0.01, bucket: 'retention' };
}
/** Compute KL divergence between two distributions */
function klDivergence(p, q) {
    const keys = ['turnover', 'retention', 'progression', 'opportunity', 'goal'];
    const eps = 1e-6;
    let kl = 0;
    for (const k of keys) {
        const pk = Math.max(p[k], eps);
        const qk = Math.max(q[k], eps);
        kl += pk * Math.log(pk / qk);
    }
    return Math.max(0, kl);
}
/** Compute posterior trajectories */
function computePosteriorTrajectories(results, playerIds) {
    if (results.length === 0)
        return [];
    const horizonLen = results[0].frames.length;
    return playerIds.map((pid) => {
        const meanPath = [];
        const variance = [];
        for (let fi = 0; fi < horizonLen; fi++) {
            let sumX = 0, sumY = 0, count = 0;
            const xs = [];
            const ys = [];
            for (const result of results) {
                const frame = result.frames[fi];
                const pos = frame?.positions[pid];
                if (!pos)
                    continue;
                sumX += pos[0];
                sumY += pos[1];
                xs.push(pos[0]);
                ys.push(pos[1]);
                count++;
            }
            if (count === 0) {
                meanPath.push([0, 0]);
                variance.push(0);
                continue;
            }
            const mx = sumX / count;
            const my = sumY / count;
            meanPath.push([Math.round(mx * 100) / 100, Math.round(my * 100) / 100]);
            let varSum = 0;
            for (let i = 0; i < count; i++) {
                varSum += (xs[i] - mx) ** 2 + (ys[i] - my) ** 2;
            }
            variance.push(Math.round((varSum / count) * 100) / 100);
        }
        return { playerId: pid, meanPath, variance };
    });
}
export async function computePlayStats(play, simulator, pauseFrame) {
    const posteriors = [];
    const playerStats = [];
    let posteriorTrajectories;
    // Identify attacking team (simple heuristic: who has ball mostly?)
    // For now default to 'home'
    const attackingTeam = play.meta?.offense === 'away' ? 'away' : 'home';
    for (let fi = 0; fi < play.frames.length; fi++) {
        const distribution = {
            turnover: 0, retention: 0, progression: 0, opportunity: 0, goal: 0
        };
        let totalXG = 0;
        // Start ball position for measuring progression
        const frame = play.frames[fi];
        const ballPos = frame.positions['ball'];
        const startBallX = ballPos ? ballPos[0] : (attackingTeam === 'home' ? 52.5 : 52.5);
        const simInputs = Array.from({ length: NUM_SIMS }, () => buildSimInput(play, fi, 0.3));
        const results = await Promise.all(simInputs.map(input => simulator.predict(input)));
        for (const result of results) {
            const outcome = classifyOutcome(result, startBallX, attackingTeam);
            distribution[outcome.bucket] += 1 / NUM_SIMS;
            totalXG += outcome.xG;
        }
        posteriors.push({
            frameId: play.frames[fi].id,
            pGoal: distribution.goal + distribution.opportunity * 0.3, // Smoothed pGoal
            pTurnover: distribution.turnover,
            expectedXG: Math.round((totalXG / NUM_SIMS) * 100) / 100,
            distribution,
        });
        if (pauseFrame != null && fi === pauseFrame) {
            const playerIds = Object.keys(play.players).filter(id => id !== 'ball');
            posteriorTrajectories = computePosteriorTrajectories(results, playerIds);
        }
    }
    // Compute deltas
    const deltas = [];
    for (let i = 1; i < posteriors.length; i++) {
        const kl = klDivergence(posteriors[i].distribution, posteriors[i - 1].distribution);
        deltas.push({
            frameId: posteriors[i].frameId,
            deltaPGoal: posteriors[i].pGoal - posteriors[i - 1].pGoal,
            klDivergence: Math.round(kl * 10000) / 10000,
            isPivotal: kl > KL_PIVOT_THRESHOLD,
        });
    }
    // Identify pivotal frames
    const sortedDeltas = [...deltas].sort((a, b) => b.klDivergence - a.klDivergence);
    const pivotalFrames = sortedDeltas.slice(0, TOP_PIVOTAL).map((d) => d.frameId);
    // Attributions (simplified for now to just re-sim pivotal)
    const attributions = [];
    // Logic same as NFL but using new distribution keys/logic
    // For brevity/safety attributions skipped in this pass, can add later if crucial
    return { posteriors, deltas, attributions, playerStats, pivotalFrames, posteriorTrajectories };
}
