// Reuse small glow sprites instead of allocating gradients and applying blur
// for every particle on every frame. The bounded cache survives route changes.
const particleSprites = new Map()
const spriteLimit = 192

export function sampleParticleTrail(pointAt, time, { duration = 200, maxLength = 24, earliestTime = 0 } = {}) {
  const points = [pointAt(time)]
  let length = 0
  for (let step = 1; step <= 12; step += 1) {
    const pastTime = Math.max(earliestTime, time - step / 12 * duration)
    const point = pointAt(pastTime)
    const previous = points[points.length - 1]
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y)
    if (distance < 0.001) break
    if (length + distance >= maxLength) {
      const fraction = (maxLength - length) / distance
      points.push({ x: previous.x + (point.x - previous.x) * fraction, y: previous.y + (point.y - previous.y) * fraction })
      break
    }
    points.push(point)
    length += distance
    if (pastTime === earliestTime) break
  }
  return points
}

export function drawFlowTrail(context, { points, color, lineWidth = 1.4, visibility = 1 }) {
  if (points.length < 2) return
  const head = points[0], tail = points[points.length - 1]
  const gradient = context.createLinearGradient(tail.x, tail.y, head.x, head.y)
  gradient.addColorStop(0, `${color}00`)
  gradient.addColorStop(0.5, `${color}70`)
  gradient.addColorStop(1, color)
  context.beginPath()
  context.moveTo(tail.x, tail.y)
  for (let step = points.length - 2; step >= 0; step -= 1) context.lineTo(points[step].x, points[step].y)
  context.globalAlpha = visibility * 0.72
  context.strokeStyle = gradient
  context.lineWidth = lineWidth
  context.lineCap = 'round'
  context.lineJoin = 'round'
  context.shadowColor = color
  context.shadowBlur = 4
  context.stroke()
  context.shadowBlur = 0
}

export function drawFlowParticle(context, { x, y, radius, color, visibility = 1 }) {
  if (visibility <= 0) return
  const size = Math.round(radius * 8) / 8
  const tint = `#${[1, 3, 5].map((offset) => Math.min(255, Math.round(Number.parseInt(color.slice(offset, offset + 2), 16) / 8) * 8).toString(16).padStart(2, '0')).join('')}`
  const key = `${tint},${size}`
  let sprite = particleSprites.get(key)
  if (!sprite) {
    const padding = Math.ceil(Math.max(size * 3.5, size + 10))
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = padding * 4
    const buffer = canvas.getContext('2d')
    buffer.scale(2, 2)
    paintParticle(buffer, padding, padding, size, tint)
    sprite = { canvas, padding }
    if (particleSprites.size >= spriteLimit) particleSprites.delete(particleSprites.keys().next().value)
    particleSprites.set(key, sprite)
  }
  context.globalAlpha = visibility
  context.drawImage(sprite.canvas, x - sprite.padding, y - sprite.padding, sprite.padding * 2, sprite.padding * 2)
}

function paintParticle(context, x, y, radius, color) {
  const haloRadius = radius * 3.5
  const halo = context.createRadialGradient(x, y, 0, x, y, haloRadius)
  halo.addColorStop(0, `${color}38`)
  halo.addColorStop(0.3, `${color}12`)
  halo.addColorStop(1, `${color}00`)
  context.beginPath()
  context.arc(x, y, haloRadius, 0, Math.PI * 2)
  context.globalAlpha = 0.8
  context.fillStyle = halo
  context.fill()

  context.beginPath()
  context.arc(x, y, radius, 0, Math.PI * 2)
  context.fillStyle = color
  context.shadowColor = color
  context.shadowBlur = 5
  context.fill()
  context.shadowBlur = 0

  context.beginPath()
  context.arc(x, y, radius * 0.25, 0, Math.PI * 2)
  context.globalAlpha = 0.3
  context.fillStyle = '#E8DCEC'
  context.fill()
}
