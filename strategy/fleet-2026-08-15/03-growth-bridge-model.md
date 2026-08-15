# Fleet report 03 — the growth-bridge cash model (100-forecasting-analyst lane)

Delivered 2026-08-15, filed verbatim. The runnable model is preserved beside this file
as thrive_model.py (Python 3, stdlib only; every assumption in one BASE dict).

ATTRIBUTION CORRECTION (added at filing, per doctrine): the '55% agent comp share'
the model calls an owner-stated fact was actually a modeling assumption supplied in
the tasking prompt, NOT something the owner claimed. The finding survives restated
honestly: industry-typical agent comp (~55% of collected commission), company-paid
leads at market CPL, and a 13% net margin cannot all be true at once — so today's
real structure must differ from at least one of them, and which one it is
determines every downstream number.

---

Model complete and verified. Here is the full deliverable.

---

# THRIVE $1M → $25M Monthly-AP Growth Bridge Model

**Model file (runnable, all assumptions adjustable):** `/tmp/claude-0/-home-user-core-platform-site/4238f515-f4e0-5863-b6dc-abe7c26d0274/scratchpad/thrive_model.py` (Python 3.11, stdlib only). No repository writes were made.

## Assumption ledger

Every parameter lives in one `BASE` dict. **[ADJ]** = adjustable; ranges tested shown.

| # | Assumption | Base | Range tested | Source |
|---|---|---|---|---|
| A1 | AP trajectory | $1M → $25M in 30 mo (11.33%/mo) | fixed target | owner plan |
| A2 | AP per productive agent | $25K/mo | $15K / $20K / $25K | plan assumes 25K |
| A3 | Month-1 ramp | 40% of mature | 30–50% | given |
| A4 | 90-day retention of hires | 60% (geometric path) | 50–70% | given |
| A5 | Mature attrition | 4%/mo after month 3 | 3–6% | given |
| A6 | Recruit cost (license+train) | $3K/hire | — | my estimate, labeled |
| A7 | AP per policy | $900 | — | given |
| A8 | Qualified-call close rate | 20% | 15–25% | given |
| A9 | Cost per qualified call | $60 | $45–$75 | given range |
| A10 | First-year comp | 110% of AP | — | given |
| A11 | Advance | 75% of comp at issue; 25% as-earned mo 10–12 × persistency | 65–85% | given (9-mo advance) |
| A12 | Persistency (13-mo) | 70% | 60/70/80 | given |
| A13 | Chargebacks | 25% of a lapsing cohort's advance, clawed evenly months 6–13 post-sale | severity 15–35% | given |
| A14 | Office | $9K/mo rent; opens at ceil(productive/12); $55K launch capex | capex 40–70K | given |
| A15 | Overhead | $25K base + $600/active agent/mo | 400–900 | my estimate, labeled |
| A16 | Agent payout share | **backed into** to make today's 13% net true → **39.2% of collected commission** | — | calibrated, held fixed |
| A17 | Reinvestment | 75% of net thru mo 12, linear to 45% by mo 24 | — | owner plan |
| A18 | Starting cash | $130K (≈1 month of today's net) | — | my estimate, labeled |

**Mechanics worth knowing:** hiring is "hire-ahead" (this month's recruits sized to cover next month's target at full production, survival-adjusted), which avoids the ramp-month oscillation a naive greedy hirer produces; the model warm-starts with 120 months of steady $1M history so trailing commissions and chargebacks exist from month 1; owner draws = (1 − reinvest%) of positive net, cash permitting; "external capital" = deepest dip of the cash reserve below zero when the AP curve is forced; the "capped-reinvestment" run instead slows growth whenever retained cash would go negative.

## The Python

```python
"""THRIVE $1M -> $25M monthly-AP growth bridge model.
Every assumption lives in BASE and is adjustable. All dollar figures monthly unless noted."""
import math, copy

BASE = dict(
    # --- trajectory ---
    ap0=1_000_000.0, ap30=25_000_000.0, T=30,          # $25M at month 30 => 11.33%/mo compounded
    # --- agent engine [ADJ] ---
    ap_per_agent=25_000.0,      # blended monthly AP per productive agent (scenarios: 15k/20k/25k)
    ramp_factor=0.40,           # month-1 production as share of mature
    ret90=0.60,                 # share of hires still active at day 90
    mature_attr=0.04,           # monthly attrition after month 3
    recruit_cost=3_000.0,       # licensing + training + recruiting cost per hire
    # --- demand engine [ADJ] ---
    ap_per_policy=900.0,        # avg annualized premium per policy
    close_rate=0.20,            # qualified-inbound-call close rate
    calls_per_day=8.0, workdays=20.0,   # mature agent call capacity
    cpl=60.0,                   # $/qualified inbound call (range 45-75)
    lead_rnd_bucket=12_500.0,   # the plan's monthly lead-R&D allocation
    # --- cash engine [ADJ] ---
    comp_rate=1.10,             # first-year comp as % of AP
    adv_frac=0.75,              # advanced share of first-year comp (9-month advance)
    trail_lo=10, trail_hi=12,   # as-earned tail paid months 10-12 after sale
    persistency=0.70,           # 13-month persistency (scenarios: 0.60/0.70/0.80)
    cb_sev=0.25,                # share of a lapsing cohort's advanced comp clawed back
    cb_lo=6, cb_hi=13,          # chargeback arrival window (months after sale)
    office_rent=9_000.0, agents_per_office=12, launch_capex=55_000.0,  # capex range 40-70k
    oh_base=25_000.0, oh_per_agent=600.0,   # central overhead: base + per active agent
    target_margin=0.13,         # today's observed net margin on AP (calibration anchor)
    reinvest_early=0.75, reinvest_late=0.45,  # reinvestment share of net: 75% thru m12 -> 45% by m24
    start_cash=130_000.0,       # working capital on hand today (~1 month of current net)
)
BASE['max_g'] = (BASE['ap30']/BASE['ap0'])**(1.0/BASE['T']) - 1.0   # 0.11326

# ---------------- agent engine ----------------
def S(a, P):
    """Survival of a hire at age a (months since hire; hire month = age 1)."""
    if a < 1: return 0.0
    if a <= 3: return P['ret90']**(a/3.0)          # geometric path to 60% at 90 days
    return P['ret90']*(1.0-P['mature_attr'])**(a-3)

def prodf(a, P):
    return P['ramp_factor'] if a == 1 else 1.0     # 30-day ramp at 40% of mature

def steady_hires(P):
    pe0 = P['ap0']/P['ap_per_agent']
    return pe0/sum(S(a,P)*prodf(a,P) for a in range(1,121))

def agent_engine(P, ap_path):
    """Hire-ahead: H[t] sized so next month's cohorts (at full production, survival S(2))
    close the gap to next month's AP target. Warm start: 120 months of steady hiring at $1M."""
    T = len(ap_path)-1
    ap_ext = list(ap_path) + [ap_path[-1]**2/ap_path[-2]]   # geometric extrapolation for month T+1
    h_ss = steady_hires(P)
    hires = {m: h_ss for m in range(-120, 0)}
    for t in range(0, T+1):
        pe_next = sum(h*S(t+1-m+1,P)*prodf(t+1-m+1,P) for m,h in hires.items())
        gap = ap_ext[t+1]/P['ap_per_agent'] - pe_next
        hires[t] = max(0.0, gap/S(2,P))
    PE    = [sum(h*S(t-m+1,P)*prodf(t-m+1,P) for m,h in hires.items()) for t in range(T+1)]
    heads = [sum(h*S(t-m+1,P)              for m,h in hires.items()) for t in range(T+1)]
    H = [hires.get(t,0.0) for t in range(T+1)]
    return H, PE, heads, h_ss

# ---------------- calibration ----------------
def calibrate_share(P):
    """Back into the agent payout share (of collected commission cash) that makes
    today's 13% net margin true at steady-state $1M with all other assumptions."""
    h = steady_hires(P)
    heads_ss = h*sum(S(a,P) for a in range(1,121))
    pe0 = P['ap0']/P['ap_per_agent']
    rev  = P['comp_rate']*P['ap0']*(P['adv_frac'] + (1-P['adv_frac'])*P['persistency'])
    cb   = P['cb_sev']*P['adv_frac']*P['comp_rate']*P['ap0']*(1-P['persistency'])
    leads= P['ap0']/P['ap_per_policy']/P['close_rate']*P['cpl']
    rent = math.ceil(pe0/P['agents_per_office'])*P['office_rent']
    oh   = P['oh_base'] + P['oh_per_agent']*heads_ss
    rec  = P['recruit_cost']*h
    share = 1 - (P['target_margin']*P['ap0'] + cb + leads + rent + oh + rec)/rev
    return share, dict(rev=rev, cb=cb, leads=leads, rent=rent, oh=oh, rec=rec)

# ---------------- cash engine ----------------
def rf(t, P):
    if t <= 12: return P['reinvest_early']
    return max(P['reinvest_late'],
               P['reinvest_early'] - (P['reinvest_early']-P['reinvest_late'])*(t-12)/12.0)

def cash_engine(P, share, ap_path, H, PE, heads):
    T = len(ap_path)-1
    ap = lambda t: ap_path[t] if t >= 0 else P['ap0']    # pre-history: steady $1M book
    prev_off = math.ceil((P['ap0']/P['ap_per_agent'])/P['agents_per_office'])
    reserve, rows = P['start_cash'], []
    nwin = P['cb_hi']-P['cb_lo']+1
    ntr  = P['trail_hi']-P['trail_lo']+1
    for t in range(1, T+1):
        adv   = P['adv_frac']*P['comp_rate']*ap(t)
        trail = sum((1-P['adv_frac'])*P['comp_rate']*ap(t-k)*P['persistency']/ntr
                    for k in range(P['trail_lo'],P['trail_hi']+1))
        rev = adv + trail
        agent_pay = share*rev
        cb = sum(P['cb_sev']*P['adv_frac']*P['comp_rate']*ap(t-k)*(1-P['persistency'])/nwin
                 for k in range(P['cb_lo'],P['cb_hi']+1))
        leads = ap(t)/P['ap_per_policy']/P['close_rate']*P['cpl']
        off = max(prev_off, math.ceil(PE[t]/P['agents_per_office']))
        capex = (off-prev_off)*P['launch_capex']; prev_off = off
        rent = off*P['office_rent']
        oh = P['oh_base'] + P['oh_per_agent']*heads[t]
        rec = P['recruit_cost']*(H[t] + (H[0] if t == 1 else 0.0))
        net = rev - agent_pay - cb - leads - rent - oh - rec - capex
        reserve += net
        dist = min((1-rf(t,P))*max(net,0.0), max(reserve,0.0))   # owner draw per plan, cash permitting
        reserve -= dist
        rows.append(dict(t=t, ap=ap(t), rev=rev, agent=agent_pay, cb=cb, leads=leads,
                         rent=rent, oh=oh, rec=rec, capex=capex, off=off,
                         net=net, dist=dist, reserve=reserve))
    return rows

def run(P, share, ap_path=None):
    if ap_path is None:
        ap_path = [P['ap0']*(P['ap30']/P['ap0'])**(t/P['T']) for t in range(P['T']+1)]
    H, PE, heads, h_ss = agent_engine(P, ap_path)
    rows = cash_engine(P, share, ap_path, H, PE, heads)
    return ap_path, H, PE, heads, rows

def summarize(H, rows):
    trough = min(rows, key=lambda r: r['reserve'])
    return dict(peak_recruits=max(H[1:]), peak_leads=max(r['leads'] for r in rows),
                trough_m=trough['t'], trough=trough['reserve'],
                ext_cap=max(0.0, -min(r['reserve'] for r in rows)),
                cum_net=sum(r['net'] for r in rows), cum_dist=sum(r['dist'] for r in rows))

# ---------------- reinvestment-constrained run ----------------
def constrained_path(P, share):
    """Grow as fast as the plan allows (<=11.33%/mo) subject to: cash reserve from
    retained earnings never goes below zero (no external capital). Owner draws per plan."""
    path = [P['ap0']]
    for t in range(1, P['T']+1):
        g = P['max_g']; chosen = None
        while g >= -1e-9:
            cand = path + [path[-1]*(1.0+g)]
            H, PE, heads, _ = agent_engine(P, cand)
            rows = cash_engine(P, share, cand, H, PE, heads)
            if min(r['reserve'] for r in rows[:t]) >= -1e-6:
                chosen = cand; break
            g -= 0.005
        path = chosen if chosen else path + [path[-1]]
    return path
```

(The output section of the script — scenario loops, tornado, and table printers — is in the same file; omitted here for length since its printed results follow verbatim.)

## Output 0 — Calibration: the 55% comp claim fails arithmetic

```
CALIBRATION  (steady state at $1M/mo AP, 25k/agent, persistency 70%, CPL $60)
  Monthly commission cash on $1M AP  : $1,017,500  (= 110% comp x [75% advanced + 25% tail x persistency])
  Chargebacks (steady)               : $61,875
  Lead spend  ($60/call, $900 AP/pol, 20% close): $333,333  (33.3% of AP)
  Office rent / overhead / recruiting: $36,000 / $49,763 / $7,534
  IMPLIED AGENT PAYOUT SHARE         : 39.2% of collected commission (= 39.9% of AP)
  -> If agents actually keep 55% of comp AND the company pays for leads, net margin would be -3.1%, not +13.0%.
  -> The stated 55% is only consistent if agents buy their own leads out of it (55% - ~33% lead cost = ~22% net to agent).
```

As instructed, I backed into whatever makes today's 13% true: **agent payout of 39.2% of collected commission** (≈40% of AP). The stated ~55% share, company-paid leads at market CPL, and a 13% net margin **cannot all be true at once** — one of the three is wrong today, and the owner should find out which before scaling it 25x.

## Output 1 — Agent engine

```
 mo   AP $M  recruits   active  productiveEq  plan curve
  1    1.11        11       54            48          45
  3    1.38        13       66            60          55
  6    1.90        18       92            82          76
  9    2.63        25      126           114         105
 12    3.62        35      174           157         145
 15    5.00        48      241           216         200
 18    6.90        66      332           298         276
 21    9.52        92      458           412         381
 24   13.13       126      632           568         525
 27   18.12       174      872           784         725
 30   25.00       241     1203          1081        1000
  Total recruits over 30 months: 2,281   Peak month: 241

   AP/agent  agents@m30  recruits(peak/mo)  recruits(total)  offices@m30  calls/agent/day
       15k        1802                401             3801          151              4.2
       20k        1351                301             2851          113              5.6
       25k        1081                241             2281          91               6.9
  Capacity check: mature agent = 160 qualified calls/mo -> $28.8k AP/mo ceiling. $25k/agent = 87% utilization; $15k = 52%.
```

The plan's 40→1,000 curve counts only *producers*; the funnel (40% first-month ramp, 60% ninety-day survival, 4%/mo attrition) means the **headcount machine must run ~20% hotter than the plan curve at all times** (1,203 active for 1,000 productive-equivalents), and the month-30 stock includes ~80 productive-equivalents of ramping hires needed just to keep month 31 growing. To hit month 30 at $25K/agent you must **hire 2,281 people in 30 months, peaking at ~241/month** — roughly 11 recruits every business day. At $15K/agent it's 3,801 total / 401 peak, and today's "$1M with 40 agents" would already be false (it implies 67 agents). Note $25K/agent means 87% of theoretical call capacity — no slack; $15K is the realistic blended figure once new-cohort mix is included, and it nearly doubles the machine.

## Output 2 — Demand engine

```
 mo   AP $M  policies     calls  spend@$45  spend@$60  spend@$75 % of AP@60 x R&D bucket
  0    1.00     1,111     5,556      0.25M      0.33M      0.42M      33.3%          27x
  6    1.90     2,115    10,576      0.48M      0.63M      0.79M      33.3%          51x
 12    3.62     4,027    20,133      0.91M      1.21M      1.51M      33.3%          97x
 18    6.90     7,665    38,326      1.72M      2.30M      2.87M      33.3%         184x
 24   13.13    14,592    72,959      3.28M      4.38M      5.47M      33.3%         350x
 30   25.00    27,778   138,889      6.25M      8.33M     10.42M      33.3%         667x
  Required spend is already 27x the $12.5k bucket at month 0.
  Even the month-1 INCREMENT in required spend ($37,755) is 3.0x the whole bucket.
```

At $900/policy and 20% close, $25M/month is **27,778 policies and 138,889 qualified calls per month** — $6.25–10.4M/month of media. **The $12.5K lead-R&D bucket is absurd in month 1, not at some future month**: acquisition already costs 27x the bucket today, and even the first month's *increment* is 3x the bucket. The month-0 reinvestment budget (75% × $130K = $97.5K) covers under a third of the month-0 lead bill — lead cost is a unit-economic line that must be priced into agent comp/margin, never a "reinvestment" item.

## Output 3 — Cash engine (base case: $25K/agent, 70% persistency, $60 CPL)

```
 mo     AP  commCash  agentPay   leads  chgbk   rent   ovhd   recr  capex     net   draw  reserve  ($M)
  1   1.11     1.111     0.436   0.371  0.062  0.045  0.057  0.062  0.055   0.023  0.006    0.147
  3   1.38     1.331     0.522   0.460  0.062  0.045  0.065  0.040  0.000   0.137  0.034    0.342
  6   1.90     1.763     0.691   0.635  0.062  0.063  0.080  0.055  0.000   0.177  0.044    0.618
  9   2.63     2.359     0.925   0.876  0.068  0.090  0.101  0.076  0.055   0.169  0.042    0.962
 12   3.62     3.205     1.257   1.208  0.084  0.126  0.130  0.105  0.110   0.186  0.046    1.405
 15   5.00     4.422     1.734   1.667  0.115  0.171  0.169  0.144  0.110   0.311  0.101    2.007
 18   6.90     6.101     2.392   2.300  0.159  0.225  0.224  0.199  0.110   0.492  0.197    2.802
 21   9.52     8.418     3.301   3.173  0.219  0.315  0.300  0.275  0.220   0.615  0.292    3.739
 24  13.13    11.614     4.554   4.378  0.302  0.432  0.404  0.379  0.275   0.890  0.489    4.888
 27  18.12    16.024     6.284   6.040  0.417  0.594  0.548  0.523  0.385   1.234  0.678    6.411
 30  25.00    22.109     8.670   8.333  0.575  0.819  0.747  0.722  0.550   1.693  0.931    8.525
  30-mo operating cash: $16.1M   owner draws: $7.7M   min reserve: $0.15M (month 1)
  Growth hangover check: freeze AP at $25M after m30 -> avg net m31-42 = $3.36M/mo (13.5% of AP)
  vs $1.69M in m30. Advances flatter growth; chargebacks land after it stops.
```

(Full 30-row table prints from the script; intermediate rows follow the same trend.) The structural surprise: **with a 9-month advance, growth is cash-flattering, not cash-draining** — each new dollar of AP brings 82.5¢ in the door immediately while its chargebacks arrive 6–13 months later against a book that has since tripled. In-growth net margin runs ~7–9% of AP; the same book run flat yields 13.5%. This is the "advance treadmill": the model looks *best* while growing fastest, which is exactly when a persistency or CPL miss is fatal, and the true economics only appear ~a year after growth stops.

## Output 4 — Verdict tables

```
VERDICT - CPL $60/qualified call, agent share held at calibrated 39.2%
 AP/agent  persist peak recruits peak ad $/mo trough mo  trough $M ext capital m30 AP (capped reinvest)
     15k      60%           401        8.33M        30      -4.36      $4.36M                  10.7M
     15k      70%           401        8.33M        30      -1.21      $1.21M                  20.9M
     15k      80%           401        8.33M         1       0.11        none                  25.0M
     20k      60%           301        8.33M         1       0.08        none                  25.0M
     20k      70%           301        8.33M         1       0.12        none                  25.0M
     20k      80%           301        8.33M         1       0.15        none                  25.0M
     25k      60%           241        8.33M         1       0.12        none                  25.0M
     25k      70%           241        8.33M         1       0.15        none                  25.0M
     25k      80%           241        8.33M         1       0.18        none                  25.0M

VERDICT - CPL $75/qualified call (stress), agent share held at calibrated 39.2%
     15k      60%           401       10.42M        30     -24.02     $24.02M                   1.1M
     15k      70%           401       10.42M        30     -20.86     $20.86M                   1.4M
     15k      80%           401       10.42M        30     -17.69     $17.69M                   3.0M
     20k      60%           301       10.42M        30     -13.11     $13.11M                   1.2M
     20k      70%           301       10.42M        30      -9.95      $9.95M                   4.2M
     20k      80%           301       10.42M        30      -6.80      $6.80M                   9.7M
     25k      60%           241       10.42M        30      -6.64      $6.64M                   3.1M
     25k      70%           241       10.42M        30      -3.49      $3.49M                  12.2M
     25k      80%           241       10.42M        30      -0.35      $0.35M                  22.7M
```

Reading it: **if unit economics hold at today's calibration ($60 CPL, ≥$20K/agent), the plan self-funds** — no external capital, and reinvestment-capped growth still reaches $25M. The failure modes are combinations: $15K/agent with ≤70% persistency needs $1.2–4.4M outside capital and caps out at $11–21M; and **if CPL drifts to $75 the whole grid breaks** — up to $24M of capital needed, and without it growth stalls at $1–12M. Note the trough is at month 30 and still deepening: in the broken scenarios the model isn't describing a J-curve, it's describing a business losing money on every incremental dollar of AP.

## Output 5 — Tornado (what the outcome actually hinges on)

```
  Base 30-mo cumulative operating cash: $16.1M
  assumption (low-high bound)                low delta  high delta     swing
  close rate 15-25%                             -26.2M      +15.7M     41.9M
  CPL $/qualified call 45-75                    +19.7M      -19.7M     39.3M
  advance rate 65-85%                           -11.4M      +11.4M     22.8M
  AP/productive agent 15k-25k (base=25k)        -17.4M       +0.0M     17.4M
  13-mo persistency 60-80%                       -3.2M       +3.2M      6.3M
  overhead/agent 900-400                         -3.4M       +2.3M      5.7M
  chargeback severity 35-15%                     -2.3M       +2.3M      4.5M
  90-day retention 50-70%                        -1.5M       +1.2M      2.6M
  office launch capex 70-40k                     -1.3M       +1.3M      2.6M
  mature attrition 6-3%/mo                       -0.9M       +0.5M      1.5M
  month-1 ramp 30-50%                            +0.3M       -0.2M      0.4M
```

The outcome is dominated by **cost-per-sale** — close rate and CPL together (both are the same lever: dollars of media per policy) swing ±$20–26M, an order of magnitude more than everything the plan document spends its ink on (offices, ramp, capex, attrition). The advance rate is the third lever and it's a *liquidity* lever, not a profit lever. Note persistency looks mid-table here only because its worst damage (chargebacks on a $25M book) lands in months 31–43, outside this 30-month window — do not read row 5 as "persistency doesn't matter."

## Where the model breaks (honest limits)

1. **The 55%/13%/company-paid-leads contradiction** — calibration forces one of the owner's three stated facts to be false; every downstream number inherits whichever resolution is real.
2. **CPL is assumed flat while volume grows 25x**; buying 139K qualified calls/month at the same $60 as 5.5K/month contradicts how media markets work. The $75 stress column is the more honest month-24+ picture.
3. **Fractional continuous hiring** — real recruiting at 240–400/month is lumpy, market-limited, and degrades hire quality (which then degrades A2, A4, A12 simultaneously — correlations the one-at-a-time tornado can't show).
4. **The 30-month window flatters the plan**: advances front-load cash, chargebacks trail. The hangover check (13.5% flat-book margin) is the number that must be true for the terminal business to be worth owning.
5. Carrier advance capacity, licensing throughput, and management span (1 leader per 12-agent squad ≈ 100+ competent leaders by month 30) are not modeled and any one can bind first.

## Owner findings (8 lines)

1. Your three stated facts can't coexist: 55% agent comp + company-paid leads + 13% net = −3% net. Find out today which one is actually false; the whole plan inherits the answer.
2. The plan lives or dies on cost-per-sale: close rate and $/call swing the 30-month outcome by ±$20–26M — 10x more than offices, ramp, or capex. Instrument these weekly, per squad.
3. The $12.5K/month lead budget is off by 27x on day one and 667x at scale; media must reach $6–10M/month and be funded from unit margin, not "reinvestment."
4. The real constraint is recruiting, not cash: ~2,300 hires in 30 months (peak ~240/month, ~11 per business day) just to net 1,000 producers — build that machine first.
5. At today's economics the plan self-funds; at $75/call you need up to $24M of outside capital or growth stalls below $12M. Set a hard rule: if blended CPL exceeds ~$70, stop scaling until it's fixed.
6. If real production is $15K/agent instead of $25K, everything nearly doubles: 3,800 hires, 151 offices, and $1–4M of capital needed even at $60/call. Verify the $25K on your current book before trusting it.
7. Advances make growth look profitable while it runs; the truth arrives in months 31–43 when chargebacks catch a stopped book. Judge the business on flat-book margin (~13.5% if assumptions hold), not in-growth cash.
8. Persistency below 70% combined with any other miss is what turns the trough from zero into millions — pay agents on 13-month persistency, not on issued AP.