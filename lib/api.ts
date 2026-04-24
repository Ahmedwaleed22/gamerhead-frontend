// lib/api.ts
// Central fetch wrapper — all API calls go through here.
// Automatically injects the JWT token and handles common errors.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// ─── Types ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status:  number,
    public message: string,
    public data?:   any,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?:   any
  token?:  string
  noAuth?: boolean
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T = any>(
  path:    string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token, noAuth = false, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> || {}),
  }

  if (!noAuth) {
    const jwt = token || (typeof window !== 'undefined' ? localStorage.getItem('ce_token') : null)
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data: any
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }

  if (!res.ok) {
    const message =
      (Array.isArray(data?.message) ? data.message.join(', ') : data?.message) ||
      `Request failed with status ${res.status}`
    throw new ApiError(res.status, message, data)
  }

  return data as T
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

export const api = {
  get:    <T = any>(path: string, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'GET' }),
  post:   <T = any>(path: string, body?: any, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'POST', body }),
  patch:  <T = any>(path: string, body?: any, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'PATCH', body }),
  put:    <T = any>(path: string, body?: any, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'PUT', body }),
  delete: <T = any>(path: string, opts?: RequestOptions) =>
            request<T>(path, { ...opts, method: 'DELETE' }),
}

// ─── Typed API endpoints ──────────────────────────────────────────────────────

// AUTH
export const authApi = {
  register:      (body: { username: string; email: string; password: string; dob: string }) =>
                   api.post('/auth/register', body, { noAuth: true }),
  login:         (body: { identifier: string; password: string }) =>
                   api.post('/auth/login', body, { noAuth: true }),
  me:            () => api.get('/auth/me'),
  verifyEmail:   (token: string) =>
                   api.get(`/auth/verify-email?token=${token}`, { noAuth: true }),
  forgotPassword:(email: string) =>
                   api.post('/auth/forgot-password', { email }, { noAuth: true }),
  resetPassword: (body: { token: string; password: string }) =>
                   api.post('/auth/reset-password', body, { noAuth: true }),
  changePassword:(body: { currentPassword: string; newPassword: string }) =>
                   api.post('/auth/change-password', body),
  addEmail:      (email: string) =>
                   api.post('/auth/add-email', { email }),
  onboarding:    (body: { username: string; dob: string }) =>
                   api.post('/auth/onboarding', body),
}

// USERS / PROFILE
export const usersApi = {
  // Own profile — requires auth
  getMe:             ()                      => api.get('/users/me'),
  updateMe:          (body: any)             => api.patch('/users/me', body),
  changeName:        (newName: string)       => api.post('/users/me/name-change', { newName }),
  checkNameAvailability: (name: string)    => api.get<{ available: boolean; reason?: string }>(`/users/me/check-name?name=${encodeURIComponent(name)}`),
  changeNameColor:   (color: string)         => api.post('/users/me/name-color', { color }),
  redeem2xp:         ()                      => api.post('/users/me/redeem-2xp'),
  activate2xp:       ()                      => api.post('/users/me/activate-2xp'),
  sendFriendRequest:  (targetId: string)      => api.post(`/users/me/friend-request/${targetId}`),
  getFriendRequests:  ()                      => api.get('/users/me/friend-requests'),
  acceptFriend:       (requesterId: string)   => api.post(`/users/me/accept-friend/${requesterId}`),
  declineFriend:      (requesterId: string)   => api.post(`/users/me/decline-friend/${requesterId}`),
  removeFriend:       (friendId: string)      => api.delete(`/users/me/friend/${friendId}`),
  getFriends:         ()                      => api.get('/users/me/friends'),

  // Public profile by slug — no auth needed (viewing someone else's profile page)
  getBySlug:         (slug: string)          => api.get(`/users/${slug}`, { noAuth: true }),

  // Kept as alias so any existing callers don't break
  getProfile:        (slug: string)          => api.get(`/users/${slug}`, { noAuth: true }),

  // Toggle coach/premium role (for testing)
  toggleRole:        (role: string)          => api.post('/users/me/toggle-role', { role }),

  // Player search — no auth needed
  search:            (q: string, limit = 10) =>
                       api.get(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`, { noAuth: true }),
}

// GAMES
export const gamesApi = {
  getAll:    ()             => api.get('/games'),
  getBySlug: (slug: string) => api.get(`/games/${slug}`),
  getLadders:(slug: string) => api.get(`/games/${slug}/ladders`),
}

// LADDERS
export const laddersApi = {
  getAll:    ()                 => api.get('/ladders'),
  getByGame: (gameSlug: string) => api.get(`/ladders/game/${gameSlug}`),
  getBySlug: (slug: string)     => api.get(`/ladders/${slug}`),
  create:    (body: any)        => api.post('/ladders', body),
  join:      (id: string)       => api.post(`/ladders/${id}/join`),
}

// TEAMS
export const teamsApi = {
  getAll:       (query?: Record<string, string>) => api.get('/teams' + (query ? '?' + new URLSearchParams(query).toString() : '')),
  getMine:      ()                             => api.get('/teams/mine'),
  getBySlug:    (slug: string)                 => api.get(`/teams/${slug}`),
  create:       (body: any)                    => api.post('/teams', body),
  update:       (id: string, body: any)        => api.patch(`/teams/${id}`, body),
  leave:        (id: string)                   => api.delete(`/teams/${id}/leave`),
  removeMember: (id: string, memberId: string) => api.delete(`/teams/${id}/members/${memberId}`),
  delete:       (id: string)                   => api.delete(`/teams/${id}`),
}

// MATCHES
export const matchesApi = {
  // Single match
  getById:      (matchId: string)              => api.get(`/matches/${matchId}`),
  getByTeam:    (teamId: string)               => api.get(`/matches/team/${teamId}`),
  getLive:      (teamId: string)               => api.get(`/matches/team/${teamId}/live`),
  create:       (body: any)                    => api.post('/matches', body),
  getChat:      (matchId: string)               => api.get(`/matches/${matchId}/chat`),
  sendChat:     (matchId: string, body: any)   => api.post(`/matches/${matchId}/chat`, body),
  submitResult: (matchId: string, body: any)   => api.post(`/matches/${matchId}/result`, body),
  dispute:      (matchId: string, body: any)   => api.post(`/matches/${matchId}/dispute`, body),
  submitFeedback:(matchId: string, body: any)  => api.post(`/matches/${matchId}/feedback`, body),

  // Match listings (open / accept / cancel flow)
  // getOpenByGame is public — anyone can browse open matches without logging in
  getOpenByGame:  (gameSlug: string)                => api.get(`/matches/open/${gameSlug}`, { noAuth: true }),
  getOpenByTeam:  (teamId: string)                  => api.get(`/matches/open/team/${teamId}`),
  createListing:  (body: any)                       => api.post('/matches/listing', body),
  accept:         (matchId: string, body: any)      => api.post(`/matches/${matchId}/accept`, body),
  cancelListing:  (matchId: string, teamId: string) => api.post(`/matches/${matchId}/cancel`, { teamId }),
  readyUp:        (matchId: string, teamId: string) => api.post(`/matches/${matchId}/ready`, { teamId }),
  requestCancel:  (matchId: string, teamId: string) => api.post(`/matches/${matchId}/cancel-request`, { teamId }),
  recalculateRanks: ()                              => api.post('/matches/recalculate-ranks'),
}

// TOURNAMENTS
export const tournamentsApi = {
  getAll:    ()                       => api.get('/tournaments'),
  getBySlug: (slug: string)           => api.get(`/tournaments/${slug}`),
  create:    (body: any)              => api.post('/tournaments', body),
  register:  (id: string, body?: any) => api.post(`/tournaments/${id}/register`, body),
}

// PLAYER OF WEEK
export const powApi = {
  getCurrent: ()                => api.get('/player-of-week/current'),
  getRecent:  ()                => api.get('/player-of-week/recent'),
  getByWeek:  (weekKey: string) => api.get(`/player-of-week/${weekKey}`),
}

// WALLET
export const walletApi = {
  getBalance:        ()           => api.get('/wallet/balance'),
  getTransactions:   (params?: any) => api.get(`/wallet/transactions${toQuery(params)}`),
  deposit:           (body: any)  => api.post('/wallet/deposit', body),
  withdraw:          (body: any)  => api.post('/wallet/withdraw', body),
  getPrizeClaims:    ()           => api.get('/wallet/prize-claims'),
  claimPrize:        (id: string) => api.post(`/wallet/prize-claims/${id}/claim`),
  // PayPal / Venmo deposit
  createPayPalOrder: (body: any)  => api.post('/wallet/deposit/paypal/create', body),
  capturePayPalOrder:(body: any)  => api.post('/wallet/deposit/paypal/capture', body),
}

// STORE
export const storeApi = {
  getItems:           ()             => api.get('/store/items'),
  getItem:            (slug: string) => api.get(`/store/items/${slug}`),
  checkCoupon:        (code: string) => api.get(`/store/coupon/${code}`),
  checkout:           (body: any)    => api.post('/store/checkout', body),
  confirmPayment:     (body: { paymentIntentId: string }) => api.post('/store/checkout/confirm', body),
  getOrders:          ()             => api.get('/store/orders'),
  getOrderStats:      ()             => api.get('/store/orders/stats'),
  createPayPalOrder:  (body: any)    => api.post('/store/checkout/paypal/create', body),
  capturePayPalOrder: (body: any)    => api.post('/store/checkout/paypal/capture', body),
}

// FORUM
export const forumApi = {
  getBoards:         ()                            => api.get('/forum/boards'),
  getBoard:          (slug: string)                => api.get(`/forum/boards/${slug}`),
  getThreads:        (slug: string, params?: any)  => api.get(`/forum/boards/${slug}/threads${toQuery(params)}`),
  getThread:         (id: string, page?: number, userId?: string) => {
    const params = new URLSearchParams()
    if (page) params.set('page', String(page))
    if (userId) params.set('userId', userId)
    const qs = params.toString()
    return api.get(`/forum/threads/${id}${qs ? `?${qs}` : ''}`)
  },
  getHot:            (limit?: number)              => api.get(`/forum/hot${limit ? `?limit=${limit}` : ''}`),
  getStats:          ()                            => api.get('/forum/stats'),
  getRecentActivity: (limit?: number)              => api.get(`/forum/recent-activity${limit ? `?limit=${limit}` : ''}`),
  getTopPosters:     (limit?: number)              => api.get(`/forum/top-posters${limit ? `?limit=${limit}` : ''}`),
  createThread:      (body: any)                   => api.post('/forum/threads', body),
  createPost:        (threadId: string, body: any) => api.post(`/forum/threads/${threadId}/posts`, body),
  reactToPost:       (postId: string, body: any)   => api.post(`/forum/posts/${postId}/react`, body),
  subscribeThread:   (threadId: string)            => api.post(`/forum/threads/${threadId}/subscribe`),
  bookmarkThread:    (threadId: string)            => api.post(`/forum/threads/${threadId}/bookmark`),
  getRelatedThreads: (threadId: string)            => api.get(`/forum/threads/${threadId}/related`),
  reportPost:        (postId: string, body: any)   => api.post(`/forum/posts/${postId}/report`, body),
  dismissReport:     (postId: string)              => api.post(`/forum/posts/${postId}/dismiss-report`),
  getAdminReports:   (params?: any)                => api.get(`/forum/admin/reports${toQuery(params)}`),
  getAdminThreads:   (params?: any)                => api.get(`/forum/admin/threads${toQuery(params)}`),
  moveThread:        (id: string, boardSlug: string) => api.patch(`/forum/threads/${id}`, { boardSlug }),
  updateThread:      (id: string, body: any)       => api.patch(`/forum/threads/${id}`, body),
  deleteThread:      (id: string)                  => api.delete(`/forum/threads/${id}`),
  updatePost:        (id: string, body: any)       => api.patch(`/forum/posts/${id}`, body),
  deletePost:        (id: string)                  => api.delete(`/forum/posts/${id}`),
}

// COACHING
export const coachingApi = {
  getCoaches:         (params?: any)                => api.get(`/coaching/coaches${toQuery(params)}`),
  getCoach:           (slug: string)                => api.get(`/coaching/coaches/${slug}`),
  getCoachReviews:    (slug: string, page?: number) => api.get(`/coaching/coaches/${slug}/reviews${page ? `?page=${page}` : ''}`),
  hire:               (body: any)                   => api.post('/coaching/hire', body),
  getMyOrders:        ()                            => api.get('/coaching/my-orders'),
  submitReview:       (body: any)                   => api.post('/coaching/review', body),
  getDashboardProfile: ()                            => api.get('/coaching/dashboard/profile'),
  getDashboardOrders: (status?: string)             => api.get(`/coaching/dashboard/orders${status ? `?status=${status}` : ''}`),
  sendCustomOffer:    (body: any)                   => api.post('/coaching/dashboard/custom-offer', body),
  addPackage:         (body: any)                   => api.post('/coaching/dashboard/packages', body),
  updatePackage:      (id: string, body: any)       => api.post(`/coaching/dashboard/packages/${id}`, body),
  // Order lifecycle — coach
  acceptOrder:        (body: any)                   => api.post('/coaching/dashboard/orders/accept', body),
  rejectOrder:        (body: any)                   => api.post('/coaching/dashboard/orders/reject', body),
  deliverOrder:       (body: any)                   => api.post('/coaching/dashboard/orders/deliver', body),
  confirmCompletion:  (body: any)                   => api.post('/coaching/dashboard/orders/confirm-completion', body),
  // Order lifecycle — buyer
  approveDelivery:    (body: any)                   => api.post('/coaching/orders/approve', body),
  requestRevision:    (body: any)                   => api.post('/coaching/orders/revision', body),
  cancelOrder:        (body: any)                   => api.post('/coaching/orders/cancel', body),
  // Coach profile
  updateBio:          (bio: string)                 => api.post('/coaching/dashboard/bio', { bio }),
  updateCoachProfile: (body: any)                   => api.post('/coaching/dashboard/profile', body),
  getReviewDistribution: (slug: string)             => api.get(`/coaching/coaches/${slug}/review-distribution`),
}

// INVITES
export const invitesApi = {
  getMyInvites: ()                                             => api.get('/invites'),
  getCount:     ()                                             => api.get('/invites/count'),
  getSent:      ()                                             => api.get('/invites/sent'),
  send:         (body: any)                                    => api.post('/invites', body),
  respond:      (id: string, action: 'accepted' | 'declined') => api.post(`/invites/${id}/respond`, { action }),
  cancel:       (id: string)                                   => api.delete(`/invites/${id}`),
}

// LEADERBOARDS
export const leaderboardsApi = {
  get:        (params?: any) => api.get(`/leaderboards${toQuery(params)}`),
  getFilters: ()             => api.get('/leaderboards/filters'),
  getTop3:    (tab?: string) => api.get(`/leaderboards/top3${tab ? `?tab=${tab}` : ''}`),
}

// MAILBOX
export const mailboxApi = {
  getThreads:   ()                          => api.get('/mailbox'),
  getUnread:    ()                          => api.get('/mailbox/unread'),
  getMessages:  (id: string, page?: number) => api.get(`/mailbox/${id}${page ? `?page=${page}` : ''}`),
  send:         (body: any)                 => api.post('/mailbox', body),
  reply:        (id: string, body: any)     => api.post(`/mailbox/${id}/reply`, body),
  deleteThread: (id: string)                => api.delete(`/mailbox/${id}`),
  editMessage:  (msgId: string, body: string) => api.patch(`/mailbox/messages/${msgId}`, { body }),
}

// NOTIFICATIONS
export const notificationsApi = {
  getAll:         ()              => api.get('/notifications'),
  getUnreadCount: ()              => api.get('/notifications/unread-count'),
  markAllRead:    ()              => api.post('/notifications/mark-all-read'),
  markRead:       (id: string)    => api.patch(`/notifications/${id}/read`),
}

// SUPPORT
export const supportApi = {
  create:      (body: any)                 => api.post('/support', body),
  getMine:     ()                          => api.get('/support/mine'),
  getTicket:   (ticketId: string)          => api.get(`/support/${ticketId}`),
  sendMessage: (ticketId: string, body: any) => api.post(`/support/${ticketId}/message`, body),
  close:       (ticketId: string)          => api.post(`/support/${ticketId}/close`),
  reopen:      (ticketId: string)          => api.post(`/support/${ticketId}/reopen`),
  requestStaff: (body: { category: string; contextId?: string; contextLabel?: string; message?: string }) => api.post('/support/request-staff', body),
  getMyLiveChat:        ()                                          => api.get('/support/live-chat/mine'),
  sendLiveChatMessage:  (sessionId: string, body: { text: string }) => api.post(`/support/live-chat/${sessionId}/message`, body),
}

// BADGES
export const badgesApi = {
  getAll:       ()                => api.get('/badges'),
  getMy:        ()                => api.get('/badges/my'),
  getMyRecent:  (limit = 5)       => api.get(`/badges/my/recent?limit=${limit}`),
}

// LEVEL REWARDS
export const levelRewardsApi = {
  getMine:     ()                          => api.get('/level-rewards/me'),
  getCratePool:(crateType: string)         => api.get(`/level-rewards/crate-pool/${crateType}`),
  claim:       (id: string)                => api.post(`/level-rewards/${id}/claim`),
}

export const linkedAccountsApi = {
  getRedirectUrl: (platform: string) => api.get(`/auth/link/${platform}`),
  unlink:         (platform: string) => api.delete(`/auth/link/${platform}`),
  getLinked:      ()                 => api.get('/auth/linked-platforms'),
}

// PLATFORM (public, no auth)
export const platformApi = {
  getStats: () => api.get('/platform/stats', { noAuth: true }),
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function toQuery(params?: Record<string, any>): string {
  if (!params) return ''
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
  return q ? `?${q}` : ''
}

// ─── ADMIN API ───────────────────────────────────────────────────────────────

export const adminApi = {
  // Dashboard
  getStats:             ()                              => api.get(`/admin/stats`),

  // Audit Log
  getAuditLog:          (params?: any)                  => api.get(`/admin/audit-log${toQuery(params)}`),

  // Users
  getUsers:             (params?: any)                  => api.get(`/admin/users${toQuery(params)}`),
  getUser:              (id: string)                    => api.get(`/admin/users/${id}`),
  updateUser:           (id: string, body: any)         => api.patch(`/admin/users/${id}`, body),
  banUser:              (id: string, body: any)         => api.post(`/admin/users/${id}/ban`, body),
  unbanUser:            (id: string)                    => api.post(`/admin/users/${id}/unban`),
  walletAdjust:         (id: string, body: any)         => api.post(`/admin/users/${id}/wallet-adjust`, body),
  awardBadge:           (id: string, body: any)         => api.post(`/admin/users/${id}/award-badge`, body),
  resetPassword:        (id: string)                    => api.post(`/admin/users/${id}/reset-password`),
  verifyEmail:          (id: string)                    => api.post(`/admin/users/${id}/verify-email`),
  setRole:              (id: string, body: any)         => api.post(`/admin/users/${id}/set-role`, body),

  // Matches
  getMatches:           (params?: any)                  => api.get(`/admin/matches${toQuery(params)}`),
  getMatch:             (id: string)                    => api.get(`/admin/matches/${id}`),
  resolveDispute:       (id: string, body: any)         => api.post(`/admin/matches/${id}/resolve`, body),
  cancelMatch:          (id: string, body: any)         => api.post(`/admin/matches/${id}/cancel`, body),
  adjustResult:         (id: string, body: any)         => api.post(`/admin/matches/${id}/adjust-result`, body),

  // Teams
  getTeams:             (params?: any)                  => api.get(`/admin/teams${toQuery(params)}`),
  getTeam:              (id: string)                    => api.get(`/admin/teams/${id}`),
  updateTeam:           (id: string, body: any)         => api.patch(`/admin/teams/${id}`, body),
  disbandTeam:          (id: string)                    => api.post(`/admin/teams/${id}/disband`),
  removeTeamMember:     (id: string, memberId: string)  => api.delete(`/admin/teams/${id}/members/${memberId}`),
  transferCaptain:      (id: string, body: any)         => api.post(`/admin/teams/${id}/transfer-captain`, body),

  // Coaching
  getCoaches:           (params?: any)                  => api.get(`/admin/coaching/coaches${toQuery(params)}`),
  getCoach:             (id: string)                    => api.get(`/admin/coaching/coaches/${id}`),
  updateCoach:          (id: string, body: any)         => api.patch(`/admin/coaching/coaches/${id}`, body),
  verifyCoach:          (id: string)                    => api.post(`/admin/coaching/coaches/${id}/verify`),
  unverifyCoach:        (id: string)                    => api.post(`/admin/coaching/coaches/${id}/unverify`),
  suspendCoach:         (id: string)                    => api.post(`/admin/coaching/coaches/${id}/suspend`),
  deleteCoach:          (id: string)                    => api.delete(`/admin/coaching/coaches/${id}`),
  getCoachingOrders:    (params?: any)                  => api.get(`/admin/coaching/orders${toQuery(params)}`),
  updateCoachingOrder:  (id: string, body: any)         => api.patch(`/admin/coaching/orders/${id}`, body),
  getCoachingReviews:   (params?: any)                  => api.get(`/admin/coaching/reviews${toQuery(params)}`),
  deleteCoachingReview: (id: string)                    => api.delete(`/admin/coaching/reviews/${id}`),

  // Store
  getStoreItems:        (params?: any)                  => api.get(`/admin/store/items${toQuery(params)}`),
  createStoreItem:      (body: any)                     => api.post(`/admin/store/items`, body),
  updateStoreItem:      (id: string, body: any)         => api.patch(`/admin/store/items/${id}`, body),
  disableStoreItem:     (id: string)                    => api.post(`/admin/store/items/${id}/disable`),
  deleteStoreItem:      (id: string)                    => api.delete(`/admin/store/items/${id}`),
  getStoreOrders:       (params?: any)                  => api.get(`/admin/store/orders${toQuery(params)}`),
  updateStoreOrder:     (id: string, body: any)         => api.patch(`/admin/store/orders/${id}`, body),
  getCoupons:           (params?: any)                  => api.get(`/admin/store/coupons${toQuery(params)}`),
  createCoupon:         (body: any)                     => api.post(`/admin/store/coupons`, body),
  updateCoupon:         (id: string, body: any)         => api.patch(`/admin/store/coupons/${id}`, body),
  deleteCoupon:         (id: string)                    => api.delete(`/admin/store/coupons/${id}`),
  getStoreRevenue:      (params?: any)                  => api.get(`/admin/store/revenue${toQuery(params)}`),

  // Premium
  getPremiumMembers:    (params?: any)                  => api.get(`/admin/premium/members${toQuery(params)}`),
  grantPremium:         (body: any)                     => api.post(`/admin/premium/grant`, body),
  revokePremium:        (userId: string)                => api.post(`/admin/premium/revoke/${userId}`),
  getPremiumPlans:      ()                              => api.get(`/admin/premium/plans`),
  createPremiumPlan:    (body: any)                     => api.post(`/admin/premium/plans`, body),
  updatePremiumPlan:    (id: string, body: any)         => api.patch(`/admin/premium/plans/${id}`, body),
  deletePremiumPlan:    (id: string)                    => api.delete(`/admin/premium/plans/${id}`),
  getPremiumStats:      ()                              => api.get(`/admin/premium/stats`),

  // Wallet & Transactions
  getTransactions:      (params?: any)                  => api.get(`/admin/wallet/transactions${toQuery(params)}`),
  getWithdrawals:       (params?: any)                  => api.get(`/admin/wallet/withdrawals${toQuery(params)}`),
  approveWithdrawal:    (id: string)                    => api.post(`/admin/wallet/withdrawals/${id}/approve`),
  denyWithdrawal:       (id: string, body: any)         => api.post(`/admin/wallet/withdrawals/${id}/deny`, body),
  getDeposits:          (params?: any)                  => api.get(`/admin/wallet/deposits${toQuery(params)}`),
  getPrizeClaims:       (params?: any)                  => api.get(`/admin/wallet/prize-claims${toQuery(params)}`),
  getWalletSummary:     ()                              => api.get(`/admin/wallet/summary`),

  // Live Chat
  getLiveChatQueue:     ()                              => api.get(`/admin/live-chat/queue`),
  getLiveChatActive:    ()                              => api.get(`/admin/live-chat/active`),
  getLiveChatHistory:   (params?: any)                  => api.get(`/admin/live-chat/history${toQuery(params)}`),
  getLiveChatStats:     ()                              => api.get(`/admin/live-chat/stats`),
  claimLiveChat:        (sessionId: string)             => api.post(`/admin/live-chat/${sessionId}/claim`),
  transferLiveChat:     (sessionId: string, body: any)  => api.post(`/admin/live-chat/${sessionId}/transfer`, body),
  sendLiveChatMessage:  (sessionId: string, body: any)  => api.post(`/admin/live-chat/${sessionId}/message`, body),
  closeLiveChat:        (sessionId: string)             => api.post(`/admin/live-chat/${sessionId}/close`),

  // Support Tickets
  getAllTickets:        (params?: any)                  => api.get(`/admin/support${toQuery(params)}`),
  getTicket:            (id: string)                    => api.get(`/admin/support/${id}`),
  getTicketStats:       ()                              => api.get(`/admin/support/stats`),
  assignTicket:         (ticketId: string, body: any)   => api.post(`/admin/support/${ticketId}/assign`, body),
  claimTicket:          (id: string)                    => api.post(`/admin/support/${id}/claim`),
  replyToTicket:        (id: string, text: string)      => api.post(`/admin/support/${id}/reply`, { text }),
  closeTicket:          (id: string)                    => api.post(`/admin/support/${id}/close`),
  reopenTicket:         (id: string)                    => api.post(`/admin/support/${id}/reopen`),

  // Games
  getGames:             (params?: any)                   => api.get(`/admin/games${toQuery(params)}`),
  createGame:           (body: any)                     => api.post(`/admin/games`, body),
  updateGame:           (id: string, body: any)         => api.patch(`/admin/games/${id}`, body),
  disableGame:          (id: string)                    => api.post(`/admin/games/${id}/disable`),
  migrateGameSlug:      (id: string, oldSlug: string, oldName?: string) => api.post(`/admin/games/${id}/migrate-slug`, { oldSlug, oldName }),
  deleteGame:           (id: string)                    => api.delete(`/admin/games/${id}`),

  // Ladders
  getLadders:           (params?: any)                  => api.get(`/admin/ladders${toQuery(params)}`),
  createLadder:         (body: any)                     => api.post(`/admin/ladders`, body),
  updateLadder:         (id: string, body: any)         => api.patch(`/admin/ladders/${id}`, body),
  disableLadder:        (id: string)                    => api.post(`/admin/ladders/${id}/disable`),
  deleteLadder:         (id: string)                    => api.delete(`/admin/ladders/${id}`),
  resetLadderSeason:    (id: string)                    => api.post(`/admin/ladders/${id}/reset-season`),

  // Badges
  getBadges:            (params?: any)                   => api.get(`/admin/badges${toQuery(params)}`),
  createBadge:          (body: any)                     => api.post(`/admin/badges`, body),
  updateBadge:          (id: string, body: any)         => api.patch(`/admin/badges/${id}`, body),
  disableBadge:         (id: string)                    => api.post(`/admin/badges/${id}/disable`),
  deleteBadge:          (id: string)                    => api.delete(`/admin/badges/${id}`),
  awardBadgeToUser:     (body: any)                     => api.post(`/admin/badges/award`, body),

  // Forum (board management)
  getForumBoards:       ()                              => api.get(`/admin/forum/boards`),
  createBoard:          (body: any)                     => api.post(`/admin/forum/boards`, body),
  updateBoard:          (id: string, body: any)         => api.patch(`/admin/forum/boards/${id}`, body),
  deleteBoard:          (id: string)                    => api.delete(`/admin/forum/boards/${id}`),

  // Announcements
  getAnnouncements:     (params?: any)                  => api.get(`/admin/announcements${toQuery(params)}`),
  createAnnouncement:   (body: any)                     => api.post(`/admin/announcements`, body),
  updateAnnouncement:   (id: string, body: any)         => api.patch(`/admin/announcements/${id}`, body),
  deleteAnnouncement:   (id: string)                    => api.delete(`/admin/announcements/${id}`),

  // Player of the Week
  getPOTWCandidates:    ()                              => api.get(`/admin/player-of-week/candidates`),
  getPOTWCandidateMatches: (userId: string)             => api.get(`/admin/player-of-week/candidates/${userId}/matches`),
  selectPOTW:           (userId: string)                => api.post(`/admin/player-of-week/select`, { userId }),
  getPOTWHistory:       (params?: any)                  => api.get(`/admin/player-of-week/history${toQuery(params)}`),
  deletePOTW:           (id: string)                    => api.delete(`/admin/player-of-week/${id}`),

  // Analytics
  getAnalytics:         (params?: any)                  => api.get(`/admin/analytics${toQuery(params)}`),
  getRevenueChart:      (params?: any)                  => api.get(`/admin/analytics/revenue${toQuery(params)}`),
  getUserGrowth:        (params?: any)                  => api.get(`/admin/analytics/user-growth${toQuery(params)}`),
  getMatchVolume:       (params?: any)                  => api.get(`/admin/analytics/match-volume${toQuery(params)}`),
  getTopEarners:        ()                              => api.get(`/admin/analytics/top-earners`),
  getTopGames:          ()                              => api.get(`/admin/analytics/top-games`),
  getCoachingStats:     ()                              => api.get(`/admin/analytics/coaching-stats`),

  // Messages (user oversight)
  getUserMessages:      (userId: string)                => api.get(`/admin/messages/user/${userId}`),
  getConversation:      (id: string)                    => api.get(`/admin/messages/conversation/${id}`),
  deleteMessage:        (msgId: string)                 => api.delete(`/admin/messages/${msgId}`),

  // Tournaments
  getTournaments:       (params?: any)                  => api.get(`/admin/tournaments${toQuery(params)}`),
  getTournament:        (id: string)                    => api.get(`/admin/tournaments/${id}`),
  createTournament:     (body: any)                     => api.post(`/admin/tournaments`, body),
  updateTournament:     (id: string, body: any)         => api.patch(`/admin/tournaments/${id}`, body),
  deleteTournament:     (id: string)                    => api.delete(`/admin/tournaments/${id}`),

  // Notifications
  getNotifications:     (params?: any)                  => api.get(`/admin/notifications${toQuery(params)}`),
  getNotificationStats: ()                              => api.get(`/admin/notifications/stats`),

  // Invites
  getInvites:           (params?: any)                  => api.get(`/admin/invites${toQuery(params)}`),

  // Level Rewards
  getLevelRewards:      (params?: any)                  => api.get(`/admin/level-rewards${toQuery(params)}`),

  // User Game Stats
  getUserGameStats:     (userId: string)                => api.get(`/admin/users/${userId}/game-stats`),
}