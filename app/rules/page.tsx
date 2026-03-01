'use client'

import { useState } from 'react'

// ─── TERMS & POLICY ──────────────────────────────────────────────────────────
const termsData = [
  {
    title: 'Terms of Service',
    body: `By using GamerHead, you agree to be bound by the terms of these Terms of Service. GamerHead may review the Terms of Service periodically and reserves the right to change the Terms of Service at any time at its discretion.\n\n**Eligibility**\nGamerHead is defined as a gambling provider. This directly means that our gambling services are only available for players above the age of 18. We have free match-making possibilities for anyone that doesn't want to bet money on them winning online video games.\n\n**Guidelines**\nAlthough GamerHead is a professional service provider that strives for equal tolerance and acceptance. We have a list of standard guidelines that everyone has to abide by.\n\n**Financials**\nGamerHead has the complete right to manage financials any way we see fit, including the right to withhold withdrawals, remove or add balance, and deny funding deposits.\n\n**Refunds**\nGamerHead is in no way obligated to refund anyone, anything. Currencies that are associated with GamerHead such as tokens, credits or real valuta all fall under this.\n\n**Contact Details**\nIf you have any queries, requests for access or correction or complaints relating to the handling of your personal information, please contact us through our support system.`,
  },
  {
    title: 'Privacy Policy',
    body: `By using GamerHead, you agree to be bound by the terms of this Privacy Policy. GamerHead may review the Privacy Policy periodically and reserves the right to change the Privacy Policy at any time at its discretion.\n\n**Personal Information Collected**\nThe following personal information might be collected: Email Address, Date of Birth, Country of Citizenship, Physical Address, Identification Number, Government Issued Identification, Location Data, Device Information, IP Address.\n\n**Collection Purposes**\nGamerHead will collect your Personal Information only by lawful and fair means for purposes including: player identity verification, processing support enquiries, providing and improving services, and complying with legal obligations.\n\n**Security**\nYou acknowledge that no data transmission over the Internet is totally secure. GamerHead will take reasonable steps to protect your Personal Information from misuse, loss and unauthorized access using password protected systems and database technology.\n\n**Delete Personal Data**\nYou can request to have your personal data deleted if GamerHead no longer has a legal reason to continue to process or store it. You can request the deletion of your personal data by contacting support.`,
  },
  {
    title: 'Cookie Policy',
    body: `GamerHead uses cookies and similar tracking technologies to improve your experience on our platform.\n\n**Essential Cookies**\nThese cookies are required for the platform to function properly, including authentication, session management, and security features. They cannot be disabled.\n\n**Analytics Cookies**\nWe use analytics cookies to understand how visitors interact with our platform. This helps us improve performance and user experience. You can opt out of analytics cookies in your browser settings.\n\n**Third-Party Cookies**\nSome of our partners may set cookies on your device for advertising and tracking purposes. We do not control these cookies. Please refer to each partner's privacy policy for more information.`,
  },
  {
    title: 'Refund & Withdrawal Policy',
    body: `GamerHead is in no way obligated to issue refunds. All purchases of credits, tokens, and premium subscriptions are final.\n\n**Withdrawals**\nCash balance may be withdrawn once your account has been verified with valid identification. Withdrawal requests are processed within 3–5 business days. GamerHead reserves the right to delay or deny withdrawals if fraudulent activity is suspected.\n\n**Chargebacks**\nIssuing a chargeback against GamerHead will result in an immediate and permanent ban from the platform. Any outstanding balance will be forfeited.`,
  },
]

// ─── GENERAL RULES ───────────────────────────────────────────────────────────
const rulesData = [
  {
    title: 'General Conduct',
    body: `All players are expected to maintain respectful and professional behavior at all times. Behavior such as swearing, disrespect, racism, sexism, homophobia and other derogatory terms are strictly prohibited. Inappropriate behavior deemed unprofessional and non-tolerant is considered punishable.\n\nWe enforce these guidelines in any way we see fit which may but is not limited to: bans, kicks, disqualifications, timeouts or warnings.`,
  },
  {
    title: 'Match Rules & Fair Play',
    body: `All matches must be played within the designated time frame. Any misuse of our platform including glitches, disallowed modifications and bug abuses are prohibited. Players found cheating, hacking, or exploiting will be permanently banned with no appeal.\n\nMatch results must be submitted with screenshot evidence within 15 minutes of the match ending. Failure to submit results may result in a forfeit.`,
  },
  {
    title: 'Disputes & Reporting',
    body: `If a dispute arises during a match, players must open a support ticket immediately with screenshot evidence. GamerHead staff will review all disputes and make a final ruling within 48 hours. Staff decisions are final.\n\nFalse reporting or misleading staff members is considered a punishable offense and may result in disqualification or a ban.`,
  },
  {
    title: 'Eligibility & Age Requirements',
    body: `GamerHead is defined as a gambling provider. Gambling services are only available for players above the age of 18. Free match-making is available for anyone above the age of 13.\n\nAccess may be denied for the following reasons:\na) Being under the age of 18 for cash matches.\nb) Fraudulent conduct.\nc) Invalid identity information.\nd) Previous misconduct and abuse.`,
  },
  {
    title: 'Wager Matches',
    body: `All wager amounts must be agreed upon by both parties before the match begins. Once a wager match is accepted, both players are locked into the agreed amount. Withdrawing from a wager match after acceptance may result in a penalty.\n\nGamerHead takes a platform fee on all wager matches. This fee is clearly displayed before any match is accepted.`,
  },
  {
    title: 'Team Rules',
    body: `Teams must have a minimum of 2 and maximum of 10 registered members. Team captains are responsible for their team members' conduct. Roster changes must be submitted at least 24 hours before a tournament match.\n\nPlayers may only be registered on one team per game at any given time. Playing on multiple teams in the same tournament is grounds for disqualification.`,
  },
  {
    title: 'Tournament Rules',
    body: `All tournament participants must check in at least 15 minutes before the scheduled start time. Failure to check in will result in automatic disqualification and forfeiture of entry fees.\n\nTournament brackets are generated automatically. Seeding is based on ladder rank and recent performance. Bracket manipulation or collusion between teams will result in permanent bans for all involved parties.\n\nPrize distribution will occur within 48 hours of the tournament's conclusion. Prizes are awarded to the team captain's account and it is the captain's responsibility to distribute winnings among team members.`,
  },
]

// ─── F.A.Q ───────────────────────────────────────────────────────────────────
const faqData = [
  {
    title: 'How do I create an account?',
    body: `Click the "Sign Up" button in the top right corner. You'll need a valid email address, a unique username, and a password. After signing up, check your email for a verification link to activate your account.`,
  },
  {
    title: 'How do wager matches work?',
    body: `Wager matches allow you to compete for real money. Both teams agree on a wager amount before the match begins. The winning team receives the pot minus a small platform fee. You must be 18 or older and have a verified account to participate in wager matches.\n\nTo post a wager match, go to the game page, click "Post a Match", select your team, set the wager amount, and wait for an opponent to accept.`,
  },
  {
    title: 'How do XP matches work?',
    body: `XP matches are free to enter. You earn experience points for winning which contributes to your profile level, team rank, and ladder standings. XP matches are available to all players aged 13 and above.`,
  },
  {
    title: 'How do I link my gaming accounts?',
    body: `Go to Settings > Linked Accounts. Under "Gaming Platforms", click the "Link" button next to the platform you want to connect. You'll be prompted to sign in through that platform's official OAuth flow.\n\nLinked gaming accounts are required to participate in matches. For example, you need an Activision account linked to play Call of Duty matches, or a Riot account for Valorant matches.`,
  },
  {
    title: 'How do I join or create a team?',
    body: `To create a team, go to the Teams page and click "Create Team", or visit a specific game page, select a ladder, and click "Create Team" from there.\n\nTo join an existing team, the team's Leader or Captain must send you an invite. You can only be on one team per game at a time.`,
  },
  {
    title: 'What are Credits and how do I use them?',
    body: `Credits are GamerHead's platform currency. You can use Credits to:\n- Change your display name (5 Credits)\n- Purchase 2XP Tokens (2 Credits each)\n- Change your username color (1 Credit, free for Premium)\n- Enter certain tournaments\n\nCredits can be purchased from the Store or earned through promotions and events.`,
  },
  {
    title: 'How do disputes work?',
    body: `If there's a disagreement about a match result, either team can open a dispute. You'll need to provide screenshot evidence of the match result. GamerHead staff will review the evidence and make a final ruling within 48 hours.\n\nFalse or malicious dispute reports may result in penalties including bans.`,
  },
  {
    title: 'How do I withdraw my cash balance?',
    body: `Go to your Dashboard and click "Withdraw". You'll need a verified account with valid identification on file. Withdrawal requests are processed within 3–5 business days. Minimum withdrawal amount is $10.00.`,
  },
  {
    title: 'What is Premium and what perks do I get?',
    body: `Premium is GamerHead's subscription tier that unlocks exclusive perks including:\n- Free name changes (normally 5 Credits)\n- Free username color changes (normally 1 Credit)\n- Priority support\n- Exclusive profile badge\n- Access to Premium-only tournaments\n\nVisit the Premium page for pricing and full details.`,
  },
  {
    title: 'How do I report a player or team?',
    body: `You can report a player by visiting their profile and clicking the report button, or by opening a support ticket from your Dashboard. Include as much detail and evidence as possible. All reports are reviewed by our moderation team.`,
  },
]

const TABS = [
  { key: 'terms',  label: 'Terms & Policy', icon: '📜' },
  { key: 'rules',  label: 'General Rules',  icon: '📋' },
  { key: 'faq',    label: 'F.A.Q',          icon: '❓' },
] as const

type TabKey = typeof TABS[number]['key']

function AccordionItem({ title, body, defaultOpen = false }: { title: string; body: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={`accordion-item-custom${open ? ' open' : ''}`}>
      <button className="accordion-header-custom" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="accordion-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="accordion-body-custom">
          {body.split('\n').map((line, i) => (
            line.startsWith('**') && line.endsWith('**')
              ? <p key={i} style={{ fontWeight: 700, color: '#fff', marginTop: 12, marginBottom: 4 }}>{line.replace(/\*\*/g, '')}</p>
              : <p key={i} style={{ marginBottom: line === '' ? 8 : 4 }}>{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RulesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('terms')

  return (
    <div className="container" style={{ paddingBottom: 60 }}>

      {/* ── PAGE HEADER ── */}
      <section style={{ marginTop: 40, marginBottom: 32 }}>
        <div className="section-header">
          <h2 className="section-title">Rules & <span>Legal</span></h2>
          <p className="section-subtitle">Everything you need to know about using GamerHead</p>
        </div>
      </section>

      {/* ── TAB FILTERS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: `1.5px solid ${activeTab === tab.key ? 'rgba(178,45,45,0.5)' : 'rgba(255,255,255,0.08)'}`,
              background: activeTab === tab.key ? 'rgba(178,45,45,0.12)' : 'var(--bg-2)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all .15s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TERMS & POLICY ── */}
      {activeTab === 'terms' && (
        <section>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: '#fff', margin: 0 }}>Terms & Policy</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Legal terms, privacy policy, and platform policies</p>
          </div>
          <div className="accordion-list">
            {termsData.map((item, i) => (
              <AccordionItem key={i} title={item.title} body={item.body} defaultOpen={i === 0} />
            ))}
          </div>
        </section>
      )}

      {/* ── GENERAL RULES ── */}
      {activeTab === 'rules' && (
        <section>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: '#fff', margin: 0 }}>General Rules</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Read and understand the rules before competing</p>
          </div>
          <div className="accordion-list">
            {rulesData.map((item, i) => (
              <AccordionItem key={i} title={item.title} body={item.body} defaultOpen={i === 0} />
            ))}
          </div>
        </section>
      )}

      {/* ── F.A.Q ── */}
      {activeTab === 'faq' && (
        <section>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: '#fff', margin: 0 }}>Frequently Asked Questions</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Common questions about GamerHead</p>
          </div>
          <div className="accordion-list">
            {faqData.map((item, i) => (
              <AccordionItem key={i} title={item.title} body={item.body} defaultOpen={i === 0} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
