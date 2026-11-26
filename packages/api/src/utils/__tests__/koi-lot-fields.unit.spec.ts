import { isYouTubeVideoUrl } from "../koi-lot-fields"

describe("isYouTubeVideoUrl (US-105 AC2, D-071)", () => {
  it("accepts YouTube watch, youtu.be and Shorts links", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=abc123",
      "https://youtube.com/watch?v=abc123&t=10s",
      "https://m.youtube.com/watch?v=abc123",
      "https://WWW.YouTube.com/watch?v=abc123",
      "https://youtu.be/abc123",
      "https://www.youtube.com/shorts/abc123",
      "https://youtube.com/shorts/abc123/",
    ]) {
      expect(isYouTubeVideoUrl(url)).toBe(true)
    }
  })

  it("refuses http, other hosts and look-alike domains", () => {
    for (const url of [
      "http://www.youtube.com/watch?v=abc123",
      "https://vimeo.com/abc123",
      "https://www.instagram.com/reel/abc123/",
      "https://youtube.com.evil.dev/watch?v=abc123",
      "https://youtube.com/embed/abc123",
      "https://youtube.com/live/abc123",
      "javascript:alert(1)",
      "not a url",
      "",
    ]) {
      expect(isYouTubeVideoUrl(url)).toBe(false)
    }
  })

  it("refuses a YouTube link with no video id", () => {
    for (const url of [
      "https://youtube.com/watch",
      "https://youtube.com/watch?v=",
      "https://youtu.be/",
      "https://youtu.be",
      "https://youtube.com/shorts/",
      "https://youtube.com/",
    ]) {
      expect(isYouTubeVideoUrl(url)).toBe(false)
    }
  })
})
