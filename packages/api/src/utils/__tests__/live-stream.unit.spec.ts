import { isLiveStreamUrl } from "../live-stream"

describe("isLiveStreamUrl (US-046 T-046.1, D-061)", () => {
  it("accepts https YouTube and Instagram links", () => {
    for (const url of [
      "https://youtube.com/watch?v=abc123",
      "https://www.youtube.com/live/abc123",
      "https://m.youtube.com/watch?v=abc123",
      "https://youtu.be/abc123",
      "https://instagram.com/p/abc123",
      "https://www.instagram.com/live/abc123/",
      "https://m.instagram.com/stories/abc/123",
      // Uppercase host is normalised.
      "https://WWW.YouTube.com/watch?v=abc",
    ]) {
      expect(isLiveStreamUrl(url)).toBe(true)
    }
  })

  it("refuses http, other hosts and look-alike domains", () => {
    for (const url of [
      "http://youtube.com/watch?v=abc",
      "https://youtube.com.evil.dev/x",
      "https://tiktok.com/x",
      "https://evil.dev/https://youtube.com/x",
      "javascript:alert(1)",
      "not a url",
      "",
    ]) {
      expect(isLiveStreamUrl(url)).toBe(false)
    }
  })

  it("refuses a bare host with no path", () => {
    for (const url of [
      "https://instagram.com/",
      "https://instagram.com",
      "https://youtube.com",
      "https://youtu.be",
    ]) {
      expect(isLiveStreamUrl(url)).toBe(false)
    }
  })
})
