import { describe, expect, it } from "vitest"
import { chunk } from "../../src/util/array"

describe("chunk", () => {
  it("should chunk array of size 0", () => {
    const chunks = chunk([], 1)
    expect(chunks).toEqual([])
  })

  it("should chunk array of size 1", () => {
    const chunks = chunk([1], 1)
    expect(chunks).toEqual([[1]])
  })

  it("should chunk array into sub arrays", () => {
    const chunks = chunk([1, 2, 3], 1)
    expect(chunks).toEqual([[1], [2], [3]])
  })

  it("should chunk array based on batch size", () => {
    const chunks = chunk([1, 2, 3], 2)
    expect(chunks).toEqual([[1, 2], [3]])
  })
})
