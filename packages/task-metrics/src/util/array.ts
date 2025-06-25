export function getRandomIndex<T>(array: Array<T>): T {
  const randomNumber = Math.random() * array.length
  const index = Math.floor(randomNumber)
  return array[index]
}

export interface Percentiles {
  min: number
  p15: number
  p25: number
  p50: number
  p75: number
  p85: number
  p95: number
  max: number
}

export function getPercentiles(array: Array<number>): Percentiles {
  array.sort((a, b) => a - b)
  const len = array.length
  return {
    min: array[0],
    p15: array[Math.floor(len * 0.15)],
    p25: array[Math.floor(len * 0.25)],
    p50: array[Math.floor(len * 0.5)],
    p75: array[Math.floor(len * 0.75)],
    p85: array[Math.floor(len * 0.85)],
    p95: array[Math.floor(len * 0.95)],
    max: array[array.length - 1],
  }
}

export function group<T extends { [key: string]: any }, U>(
  array: T[],
  f: (item: T) => [string, U] | undefined
): { [key: string]: U[] } {
  const results: { [key: string]: U[] } = {}

  array.forEach((item) => {
    const tuple = f(item)
    if (tuple) {
      const [key, value] = tuple
      results[key] ||= []
      results[key].push(value)
    }
  })

  return results
}

export function groupSingle<T extends { [key: string]: any }, U>(
  array: T[],
  f: (item: T) => [string, U] | undefined
): { [key: string]: U } {
  const results: { [key: string]: U } = {}

  array.forEach((item) => {
    const tuple = f(item)
    if (tuple) {
      const [key, value] = tuple
      results[key] = value
    }
  })

  return results
}

export function chunk<T>(array: T[], batchSize: number): T[][] {
  if (array.length === 0) {
    return []
  }

  const chunks: T[][] = [[]]
  let chunksIndex = 0

  for (let i = 0; i < array.length; i++) {
    const item = array[i]
    if (chunks[chunksIndex].length < batchSize) {
      chunks[chunksIndex].push(item)
    } else {
      chunks.push([item])
      chunksIndex++
    }
  }

  return chunks
}
