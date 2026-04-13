/**
 * Signal score v1 — transparent, capped components (rolling 28 days of posts).
 * Tune weights here only; keep the profile “What is Signal?” copy aligned.
 */
export const SIGNAL_POST_WINDOW_DAYS = 28

/** Max published posts in window that earn points (≈2/week over 4 weeks). */
const POST_POINT_CAP = 8
const POINTS_PER_POST = 12

/** Reactions of type `signal` on those posts. */
const SIGNAL_POINT_CAP = 25
const POINTS_PER_SIGNAL = 3

/** Comments from other members on those posts (excludes self-replies). */
const COMMENT_POINT_CAP = 30
const POINTS_PER_COMMENT = 2

export type SignalScoreInputs = {
  postsLast28: number
  signalsOnRecentPosts: number
  commentsFromOthersOnRecentPosts: number
}

export type SignalScoreBreakdown = {
  total: number
  posting: number
  recognition: number
  conversation: number
  raw: SignalScoreInputs
}

export function computeSignalScoreV1(input: SignalScoreInputs): SignalScoreBreakdown {
  const posting = Math.min(input.postsLast28, POST_POINT_CAP) * POINTS_PER_POST
  const recognition = Math.min(input.signalsOnRecentPosts, SIGNAL_POINT_CAP) * POINTS_PER_SIGNAL
  const conversation = Math.min(input.commentsFromOthersOnRecentPosts, COMMENT_POINT_CAP) * POINTS_PER_COMMENT
  return {
    total: posting + recognition + conversation,
    posting,
    recognition,
    conversation,
    raw: input,
  }
}

export const SIGNAL_SCORE_V1_RULES = [
  `Rolling window: last ${SIGNAL_POST_WINDOW_DAYS} days of your published posts.`,
  `Posting: up to ${POST_POINT_CAP} posts × ${POINTS_PER_POST} pts (steady cadence, not daily spam).`,
  `Recognition: “Signal” reactions on those posts — up to ${SIGNAL_POINT_CAP} × ${POINTS_PER_SIGNAL} pts.`,
  `Conversation: comments from other members on those posts — up to ${COMMENT_POINT_CAP} × ${POINTS_PER_COMMENT} pts (self-comments don’t count).`,
  'We ignore raw views/downloads. v1 is intentionally simple; weights will evolve.',
] as const
