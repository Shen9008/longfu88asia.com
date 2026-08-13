# -*- coding: utf-8 -*-
"""
Bulk-updates <title> and <meta name="description"> tags across the site
to maximise search-result CTR (front-loaded keywords, numbers, power words,
consistent "LongFu88 Asia" branding, optimal length).

Run from the project root:
    python scripts/update-meta-ctr.py
"""
import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

PAGES = {
    # ---- Homepage & core product pages ----
    "index.html": {
        "title": "LongFu88 Review 2026 | 1,480+ Games, Sportsbook &amp; 200% Bonus",
        "description": "LongFu88 honest review: 1,480+ games, Lightning Baccarat, 38 sports &amp; Asian handicap, 200% welcome bonus up to $1,500, 16 payment methods. Written for Asian players. 18+ only.",
    },
    "promotions.html": {
        "title": "LongFu88 Bonus 2026 | 200% Welcome + VIP Cashback Guide",
        "description": "LongFu88 bonus guide: 200% up to $1,500 + 60 free spins, wagering requirement analysis, VIP 10% cashback, missions &amp; coin shop. Read terms before claiming. 18+ only.",
    },
    "help.html": {
        "title": "LongFu88 Help Center | Login, KYC, Payments &amp; Bonuses FAQ",
        "description": "LongFu88 help for players: verify your account, fund smarter, fix withdrawals, read bonus rules &amp; game issues&mdash;longfu88 support topics explained on longfu88asia.com. 18+.",
    },
    "responsible-gambling.html": {
        "title": "LongFu88 Responsible Gambling | Limits, Tools &amp; Support",
        "description": "LongFu88 Asia responsible gambling: deposit limits, reality checks, cool-off, self-exclusion, and independent help. LongFu88 promotes safe play&mdash;18+ only.",
    },
    "privacy.html": {
        "title": "LongFu88 Privacy Policy | Data, Cookies &amp; Your Rights",
        "description": "LongFu88 Asia privacy policy: data collected on longfu88asia.com, cookies, analytics, retention, international transfers, and your rights. LongFu88 marketing site&mdash;April 2026.",
    },
    "terms.html": {
        "title": "LongFu88 Terms &amp; Conditions | Site Rules &amp; Eligibility",
        "description": "Terms for using longfu88asia.com and LongFu88 Asia marketing content: eligibility, acceptable use, bonuses disclaimer, liability, links. LongFu88 brand terms&mdash;18+ only.",
    },
    # ---- Regional hub pages ----
    "longfu88-malaysia.html": {
        "title": "LongFu88 Malaysia 2026 | MYR Casino, Slots &amp; Sports Guide",
        "description": "LongFu88 Malaysia guide: 1,480+ games, 38 sports, MYR deposits via FPX &amp; e-wallets, slots and live baccarat reviewed for local players. 18+.",
    },
    "longfu88-indonesia.html": {
        "title": "LongFu88 Indonesia 2026 | IDR Casino &amp; Sports Guide",
        "description": "LongFu88 Indonesia guide: 1,480+ games, 38 sports, IDR-friendly deposits, slots and live casino reviewed for Indonesian players. 18+ only.",
    },
    "longfu88-vietnam.html": {
        "title": "LongFu88 Vietnam 2026 | VND Casino &amp; Esports Guide",
        "description": "LongFu88 Vietnam guide: 1,480+ games, 38 sports plus esports, VND-friendly payments, slots and live casino for Vietnamese players. 18+.",
    },
    # ---- Trim overly long titles on core pages for cleaner SERP display ----
    "about.html": {
        "title": "About LongFu88 Asia | Independent Review &amp; Editorial Standards",
        "description": "About longfu88asia.com: independent editorial guide covering LongFu88 and LongFu88 Asia. Platform facts, editorial methodology, trust framework, and responsible gambling. 18+ only.",
    },
    "live-casino.html": {
        "title": "LongFu88 Live Casino 2026 | Baccarat &amp; Blackjack Strategy",
        "description": "LongFu88 live casino expert guide: 240+ tables, house edge by game, baccarat strategy (1.06% Banker edge), blackjack basic strategy, Evolution Gaming streams. 18+ only.",
    },
    "licensing.html": {
        "title": "LongFu88 Licensing, RNG &amp; Trust | Certifications Explained",
        "description": "longfu88 trust &amp; LongFu88 Asia licensing literacy: RNG, eCOGRA, iTech Labs, MGA links, responsible gambling resources. Educational hub. 18+.",
    },
    "payments.html": {
        "title": "LongFu88 Payments 2026 | Deposits, Withdrawals &amp; Crypto",
        "description": "LongFu88 payments guide: 16 methods, USDT TRC20 vs ERC20, Skrill, Neteller, cards, bank wire. Step-by-step deposit &amp; withdrawal, KYC checklist, 2&ndash;24h cashout. 18+ only.",
    },
    "sports-betting.html": {
        "title": "LongFu88 Sportsbook 2026 | Asian Handicap &amp; 38 Sports",
        "description": "LongFu88 sports betting guide: Asian handicap explained, 38 sports, 480+ leagues, esports markets, in-play discipline, and bankroll management for Asian players. 18+ only.",
    },
    # ---- Blog index ----
    "blog/index.html": {
        "title": "LongFu88 Asia Blog: Casino, Sports &amp; Payment Guides",
        "description": "Browse LongFu88 Asia guides on slots, live casino, sports betting, payments, and safer play &ndash; independent tips updated for 2026 players. 18+ only.",
    },
    # ---- Blog posts ----
    "blog/common-longfu88asia-login-problems-and-why-players-experience-them.html": {
        "title": "LongFu88 Asia Login Problems? 7 Fixes That Work",
        "description": "Can't log into LongFu88 Asia? Discover 7 common login errors, their exact causes, and step-by-step fixes to get back into your account fast. 18+.",
    },
    "blog/community-feedback-and-player-trends-around-longfu88asia.html": {
        "title": "LongFu88 Asia Player Reviews: What Users Really Say",
        "description": "See real player feedback and emerging trends on LongFu88 Asia &ndash; what members praise, what they flag, and how the platform is responding. 18+.",
    },
    "blog/comparing-popular-table-games-offered-on-longfu88asia.html": {
        "title": "Baccarat vs Roulette on LongFu88 Asia: Full Comparison",
        "description": "Baccarat or roulette on LongFu88 Asia? Compare house edge, betting limits, and pacing to pick the table game that fits your style. 18+ only.",
    },
    "blog/comparing-popular-table-games-on-longfu88asia.html": {
        "title": "LongFu88 Asia Table Games: Rules, Odds &amp; Best Picks",
        "description": "A quick-start guide to LongFu88 Asia's table games &ndash; rules, odds, and strategy basics for baccarat, roulette, and blackjack beginners. 18+.",
    },
    "blog/digital-payment-methods-supported-on-longfu88asia.html": {
        "title": "LongFu88 Asia Payment Methods: Fast Deposits &amp; Cashouts",
        "description": "Every digital payment method LongFu88 Asia supports, compared for speed, fees, and limits &ndash; find the fastest way to deposit and withdraw. 18+.",
    },
    "blog/exploring-jackpot-opportunities-on-longfu88asia-casino.html": {
        "title": "LongFu88 Asia Jackpot Slots: Biggest Wins &amp; How to Play",
        "description": "Chase bigger wins on LongFu88 Asia &ndash; explore top jackpot slots, how progressive pools grow, and smart ways to manage your bankroll. 18+.",
    },
    "blog/how-longfu88asia-integrates-sports-betting-with-casino-entertainment.html": {
        "title": "LongFu88 Asia Sportsbook + Casino: How It Connects",
        "description": "See how LongFu88 Asia blends sports betting with casino play in one account &ndash; shared wallet, crossover promos, and switching tips. 18+.",
    },
    "blog/how-longfu88asia-is-competing-in-southeast-asias-mobile-casino-market.html": {
        "title": "How LongFu88 Asia Competes in SE Asia's Casino Market",
        "description": "What sets LongFu88 Asia apart in Southeast Asia's crowded mobile casino market &ndash; game variety, speed, and player-first features. 18+.",
    },
    "blog/how-longfu88asia-maintains-secure-gaming-transactions.html": {
        "title": "LongFu88 Asia Security: Protecting Your Transactions",
        "description": "How LongFu88 Asia secures deposits and withdrawals &ndash; encryption, verification steps, and the safety habits every player should know. 18+.",
    },
    "blog/how-modern-slot-features-improve-gameplay-on-longfu88asia.html": {
        "title": "Modern Slot Features on LongFu88 Asia, Explained",
        "description": "Megaways, bonus buys, cascading reels &ndash; see how modern slot mechanics on LongFu88 Asia change the way you play and win. 18+ only.",
    },
    "blog/how-reward-campaigns-operate-on-longfu88asia-casino.html": {
        "title": "How LongFu88 Asia Bonus Campaigns Actually Work",
        "description": "Inside LongFu88 Asia's reward campaigns &ndash; how missions, cashback, and seasonal bonuses are triggered, tracked, and paid out. 18+.",
    },
    "blog/important-insights-for-new-players-at-longfu88asia.html": {
        "title": "New to LongFu88 Asia? 6 Things to Know First",
        "description": "First time on LongFu88 Asia? Get the essentials on registration, game picks, and promotions before you place your first bet. 18+.",
    },
    "blog/longfu88asia-review-unified-casino-ecosystems-in-southeast-asia.html": {
        "title": "LongFu88 Asia Review: One Account, Every Game",
        "description": "Our full LongFu88 Asia review &ndash; how its unified casino ecosystem links slots, live tables, and sports across Southeast Asia. 18+.",
    },
    "blog/managing-risk-and-rewards-on-longfu88asia.html": {
        "title": "Bankroll Management Tips for LongFu88 Asia Players",
        "description": "Practical risk-and-reward strategies for LongFu88 Asia &ndash; bankroll limits, staking plans, and knowing when to walk away. 18+ only.",
    },
    "blog/popular-sports-markets-explored-by-longfu88asia-players.html": {
        "title": "Most-Bet Sports Markets on LongFu88 Asia",
        "description": "From football handicaps to esports outrights &ndash; see the sports markets LongFu88 Asia players bet on most, and how to read them. 18+.",
    },
    "blog/seasonal-promotions-frequently-featured-on-longfu88asia.html": {
        "title": "LongFu88 Asia Seasonal Promotions Calendar",
        "description": "A look at the seasonal promotions LongFu88 Asia runs year-round &ndash; festive bonuses, tournaments, and limited-time reload offers. 18+.",
    },
    "blog/seasonal-promotions-on-longfu88asia-what-to-expect.html": {
        "title": "What to Expect From LongFu88 Asia's Next Promotion",
        "description": "Planning around LongFu88 Asia's seasonal promos &ndash; typical bonus sizes, wagering terms, and how to claim before offers expire. 18+.",
    },
    "blog/smart-gameplay-habits-for-longfu88asia-casino-users.html": {
        "title": "7 Smart Gameplay Habits for LongFu88 Asia Players",
        "description": "Simple habits that help LongFu88 Asia players stay in control &ndash; session limits, game selection, and tracking results. 18+ only.",
    },
    "blog/the-mobile-gaming-experience-offered-by-longfu88asia.html": {
        "title": "LongFu88 Asia Mobile: Play Casino &amp; Sports Anywhere",
        "description": "How the LongFu88 Asia mobile experience holds up &ndash; load speed, game library, and interface tips for phone and tablet play. 18+.",
    },
    "blog/the-real-time-dealer-experience-available-through-longfu88asia.html": {
        "title": "LongFu88 Asia Live Dealers: What to Expect",
        "description": "Inside the LongFu88 Asia live dealer experience &ndash; real hosts, real-time streams, and how it compares to playing in person. 18+.",
    },
    "blog/trending-slot-game-styles-available-on-longfu88asia.html": {
        "title": "Trending Slot Styles on LongFu88 Asia Right Now",
        "description": "Classic reels, Megaways, or themed video slots? See which slot styles are trending on LongFu88 Asia and why players love them. 18+.",
    },
    "blog/understanding-cashback-and-member-privileges-on-longfu88asia.html": {
        "title": "LongFu88 Asia Cashback &amp; VIP Perks Explained",
        "description": "How LongFu88 Asia cashback and member tiers work &ndash; qualifying play, payout timing, and the perks worth unlocking. 18+ only.",
    },
    "blog/understanding-fair-gaming-standards-applied-on-longfu88asia.html": {
        "title": "Is LongFu88 Asia Fair? RNG &amp; Fair-Play Standards",
        "description": "How LongFu88 Asia keeps games fair &ndash; RNG testing, independent audits, and what those certifications actually mean for you. 18+.",
    },
    "blog/understanding-the-gaming-environment-offered-by-longfu88asia.html": {
        "title": "Inside the LongFu88 Asia Gaming Platform",
        "description": "A closer look at the LongFu88 Asia platform &ndash; game variety, interface design, and the tech that keeps play running smoothly. 18+.",
    },
    "blog/what-makes-longfu88asia-different-from-other-online-platforms.html": {
        "title": "What Makes LongFu88 Asia Different From Rivals",
        "description": "LongFu88 Asia vs other online casinos &ndash; the features, game variety, and player-first details that set it apart. 18+ only.",
    },
    "blog/what-new-players-usually-discover-first-on-longfu88asia.html": {
        "title": "LongFu88 Asia: What New Players Notice First",
        "description": "From sign-up to first spin &ndash; what new LongFu88 Asia players typically discover, and how to make the most of it early on. 18+.",
    },
    "blog/what-players-should-understand-about-withdrawals-on-longfu88asia.html": {
        "title": "LongFu88 Asia Withdrawals: Times, Methods &amp; Tips",
        "description": "What to know before you cash out on LongFu88 Asia &ndash; processing times, payment methods, and tips for a smoother withdrawal. 18+.",
    },
    "blog/why-longfu88asia-is-becoming-popular-among-online-casino-communities.html": {
        "title": "Why LongFu88 Asia Keeps Gaining Loyal Players",
        "description": "The reasons LongFu88 Asia keeps growing its community &ndash; game selection, promos, and player experience players talk about. 18+.",
    },
    "blog/why-smartphone-players-prefer-accessing-longfu88asia-games.html": {
        "title": "Why Mobile Players Choose LongFu88 Asia",
        "description": "Why smartphone players keep coming back to LongFu88 Asia &ndash; convenience, game variety, and a smoother mobile experience. 18+.",
    },
}

TITLE_RE = re.compile(r"(<title>)([\s\S]*?)(</title>)")
DESC_RE = re.compile(r'(<meta\s+name="description"\s*\n?\s*content=")([\s\S]*?)(">)')
OG_TITLE_RE = re.compile(r'(<meta\s+property="og:title"\s+content=")([\s\S]*?)(">)')
OG_DESC_RE = re.compile(r'(<meta\s+property="og:description"\s*\n?\s*content=")([\s\S]*?)(">)')
TW_TITLE_RE = re.compile(r'(<meta\s+name="twitter:title"\s+content=")([\s\S]*?)(">)')
TW_DESC_RE = re.compile(r'(<meta\s+name="twitter:description"\s+content=")([\s\S]*?)(">)')


def apply(path, title, description):
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content
    for pattern, value, label in (
        (TITLE_RE, title, "<title>"),
        (DESC_RE, description, 'meta name="description"'),
        (OG_TITLE_RE, title, 'property="og:title"'),
        (OG_DESC_RE, description, 'property="og:description"'),
        (TW_TITLE_RE, title, 'name="twitter:title"'),
        (TW_DESC_RE, description, 'name="twitter:description"'),
    ):
        new_content, count = pattern.subn(lambda m, v=value: m.group(1) + v + m.group(3), new_content, count=1)
        if count == 0 and label in ('<title>', 'meta name="description"'):
            print(f"  [WARN] no {label} match in {path}")

    if new_content != content:
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(new_content)
        print(f"  [OK] updated {path}")
    else:
        print(f"  [SKIP] unchanged {path}")


if __name__ == "__main__":
    for rel_path, meta in PAGES.items():
        apply(rel_path, meta["title"], meta["description"])
