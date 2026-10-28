// Reparameterize the whole ensemble by mean distance traveled. Every particle
// still shares the same diffusion time; the quiet high-noise part no longer
// consumes several seconds before visible motion starts.
export function retimeDiffusionTrajectories(trajectories) {
  if (!trajectories.length) return []
  const steps = trajectories[0].length - 1
  if (!steps) return trajectories.map((points) => [...points])
  const distance = new Float64Array(steps + 1)
  for (let step = 1; step <= steps; step += 1) {
    let total = 0
    for (const points of trajectories) total += Math.hypot(points[step].x - points[step - 1].x, points[step].y - points[step - 1].y)
    distance[step] = distance[step - 1] + total / trajectories.length
  }
  const clock = []
  let upper = 1
  for (let step = 0; step <= steps; step += 1) {
    const target = distance[steps] * step / steps
    while (upper < steps && distance[upper] < target) upper += 1
    const lower = upper - 1
    const span = distance[upper] - distance[lower]
    clock.push({ lower, upper, amount: step === steps ? 1 : span ? Math.max(0, Math.min(1, (target - distance[lower]) / span)) : 0 })
  }
  return trajectories.map((points) => clock.map(({ lower, upper, amount }) => ({
    x: points[lower].x + (points[upper].x - points[lower].x) * amount,
    y: points[lower].y + (points[upper].y - points[lower].y) * amount,
  })))
}

export function diffusionMotionAt(time, duration = 12000) {
  const cycles = Math.max(0, time) / duration
  const leg = Math.floor(cycles)
  const fraction = cycles - leg
  // Briefly round off reversals, with no long easing interval at either end.
  const ramp = 0.03
  const distance = fraction < ramp ? fraction ** 2 / (2 * ramp)
    : fraction > 1 - ramp ? 1 - ramp - (1 - fraction) ** 2 / (2 * ramp)
      : fraction - ramp / 2
  const eased = distance / (1 - ramp)
  const converging = leg % 2 === 0
  return { progress: converging ? eased : 1 - eased, legStart: leg * duration, converging }
}
