// Incremental Bowyer–Watson triangulation for the small illustrative network.
// Work in screen proportions so stretching the canvas does not choose diagonals.
export function delaunayMesh(nodes, aspectRatio = 1) {
  const points = nodes.map(({ x, y }) => ({ x: x * aspectRatio, y }))
  // Keep the enclosing vertices well beyond circumcircles at the convex hull.
  const extent = Math.max(aspectRatio, 1) * 1024
  points.push({ x: -extent, y: -extent }, { x: 3 * extent, y: -extent }, { x: -extent, y: 3 * extent })
  const triangle = (a, b, c) => {
    const ax = points[a].x - points[c].x, ay = points[a].y - points[c].y
    const bx = points[b].x - points[c].x, by = points[b].y - points[c].y
    const determinant = 2 * (ax * by - ay * bx)
    if (Math.abs(determinant) < 1e-12) return null
    const aa = ax * ax + ay * ay, bb = bx * bx + by * by
    const x = points[c].x + (by * aa - ay * bb) / determinant
    const y = points[c].y + (ax * bb - bx * aa) / determinant
    return { vertices: [a, b, c], x, y, radiusSquared: (x - points[c].x) ** 2 + (y - points[c].y) ** 2 }
  }
  let triangles = [triangle(nodes.length, nodes.length + 1, nodes.length + 2)]
  for (let index = 0; index < nodes.length; index += 1) {
    const point = points[index]
    const cavity = new Set(triangles.filter(({ x, y, radiusSquared }) =>
      (point.x - x) ** 2 + (point.y - y) ** 2 < radiusSquared - 1e-12))
    const boundary = new Map()
    for (const { vertices } of cavity) {
      for (let side = 0; side < 3; side += 1) {
        const a = vertices[side], b = vertices[(side + 1) % 3]
        const key = `${Math.min(a, b)},${Math.max(a, b)}`
        if (boundary.has(key)) boundary.delete(key)
        else boundary.set(key, [a, b])
      }
    }
    triangles = triangles.filter((item) => !cavity.has(item))
    for (const [a, b] of boundary.values()) {
      const item = triangle(a, b, index)
      if (item) triangles.push(item)
    }
  }
  const faces = triangles.filter(({ vertices }) => vertices.every((index) => index < nodes.length)).map(({ vertices }) => vertices)
  const edges = new Map()
  for (const vertices of faces) {
    for (let side = 0; side < 3; side += 1) {
      const a = vertices[side], b = vertices[(side + 1) % 3]
      const first = Math.min(a, b), second = Math.max(a, b)
      edges.set(`${first},${second}`, [first, second])
    }
  }
  return { triangles: faces, edges: [...edges.values()] }
}
