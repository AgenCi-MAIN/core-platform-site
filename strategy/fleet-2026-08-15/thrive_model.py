"""THRIVE $1M -> $25M monthly-AP growth bridge model.
Every assumption lives in BASE and is adjustable. All dollar figures monthly unless noted.
"""
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
    return dict(peak_recruits=max(H[1:]) if len(H)>1 else 0,
                peak_leads=max(r['leads'] for r in rows),
                trough_m=trough['t'], trough=trough['reserve'],
                ext_cap=max(0.0, -min(r['reserve'] for r in rows)),
                cum_net=sum(r['net'] for r in rows),
                cum_dist=sum(r['dist'] for r in rows))

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

# ================= OUTPUT =================
M = lambda x: f"{x/1e6:8.2f}"
K = lambda x: f"{x/1e3:8.0f}"

P0 = copy.deepcopy(BASE)
share, cal = calibrate_share(P0)
print("="*100)
print("CALIBRATION  (steady state at $1M/mo AP, 25k/agent, persistency 70%, CPL $60)")
print("="*100)
print(f"  Monthly commission cash on $1M AP  : ${cal['rev']:,.0f}  (= 110% comp x [75% advanced + 25% tail x persistency])")
print(f"  Chargebacks (steady)               : ${cal['cb']:,.0f}")
print(f"  Lead spend  ($60/call, $900 AP/pol, 20% close): ${cal['leads']:,.0f}  ({cal['leads']/1e6:.1%} of AP)")
print(f"  Office rent / overhead / recruiting: ${cal['rent']:,.0f} / ${cal['oh']:,.0f} / ${cal['rec']:,.0f}")
print(f"  IMPLIED AGENT PAYOUT SHARE         : {share:.1%} of collected commission "
      f"(= {share*cal['rev']/1e6:.1%} of AP)")
print(f"  -> If agents actually keep 55% of comp AND the company pays for leads, net margin would be "
      f"{(0.13 - (0.55-share)*cal['rev']/1e6):+.1%}, not +13.0%.")
print(f"  -> The stated 55% is only consistent if agents buy their own leads out of it "
      f"(55% - ~{cal['leads']/cal['rev']:.0%} lead cost = ~{0.55-cal['leads']/cal['rev']:.0%} net to agent).")

# --------- 1. AGENT ENGINE ---------
ap_path, H, PE, heads, rows = run(P0, share)
plan_agents = lambda t: 40.0*(BASE['ap30']/BASE['ap0'])**(t/BASE['T'])
print("\n"+"="*100)
print("1. AGENT ENGINE - base case (25k AP/agent)   [plan curve = 40 -> 1,000 agents]")
print("="*100)
print(f"{'mo':>3} {'AP $M':>7} {'recruits':>9} {'active':>8} {'productiveEq':>13} {'plan curve':>11}")
for t in [1,3,6,9,12,15,18,21,24,27,30]:
    print(f"{t:>3} {ap_path[t]/1e6:>7.2f} {H[t]:>9.0f} {heads[t]:>8.0f} {PE[t]:>13.0f} {plan_agents(t):>11.0f}")
tot_rec = sum(H[0:31])
print(f"  Total recruits over 30 months: {tot_rec:,.0f}   Peak month: {max(H[1:]):,.0f}")
print(f"  NOTE: 'active' exceeds 'productiveEq' - the pipeline always carries ramping/failing hires.")

print("\n  Sensitivity: blended AP per productive agent")
print(f"  {'AP/agent':>9} {'agents@m30':>11} {'recruits(peak/mo)':>18} {'recruits(total)':>16} {'offices@m30':>12} {'calls/agent/day':>16}")
for apa in [15_000,20_000,25_000]:
    Pa = copy.deepcopy(BASE); Pa['ap_per_agent']=apa
    apx,Hx,PEx,hdx,_ = run(Pa, share)
    cpd = (apa/Pa['ap_per_policy']/Pa['close_rate'])/Pa['workdays']
    print(f"  {apa/1e3:>7.0f}k {PEx[30]:>11.0f} {max(Hx[1:]):>18.0f} {sum(Hx[0:31]):>16.0f} "
          f"{math.ceil(PEx[30]/12):>12} {cpd:>16.1f}")
print(f"  Capacity check: a mature agent has {BASE['calls_per_day']*BASE['workdays']:.0f} qualified calls/mo of capacity"
      f" -> ${BASE['calls_per_day']*BASE['workdays']*BASE['close_rate']*BASE['ap_per_policy']/1e3:.1f}k AP/mo ceiling."
      f" $25k/agent = 87% utilization; $15k = 52%.")

# --------- 2. DEMAND ENGINE ---------
print("\n"+"="*100)
print("2. DEMAND ENGINE - qualified inbound calls and ad spend  ($900 AP/policy, 20% close)")
print("="*100)
print(f"{'mo':>3} {'AP $M':>7} {'policies':>9} {'calls':>9} {'spend@$45':>10} {'spend@$60':>10} {'spend@$75':>10} "
      f"{'% of AP@60':>10} {'x R&D bucket':>12}")
for t in [0,1,3,6,9,12,15,18,21,24,27,30]:
    apv = P0['ap0']*(P0['ap30']/P0['ap0'])**(t/30)
    pol = apv/900.0; calls = pol/0.20
    print(f"{t:>3} {apv/1e6:>7.2f} {pol:>9,.0f} {calls:>9,.0f} {calls*45/1e6:>9.2f}M {calls*60/1e6:>9.2f}M "
          f"{calls*75/1e6:>9.2f}M {calls*60/apv:>10.1%} {calls*60/12500:>11.0f}x")
inc1 = (P0['ap0']*((P0['ap30']/P0['ap0'])**(1/30)-1))/180*60
print(f"  The $12.5k/mo lead-R&D bucket vs reality: required spend is already {1_000_000/180*60/12500:.0f}x the bucket at month 0.")
print(f"  Even the month-1 INCREMENT in required spend (${inc1:,.0f}) is {inc1/12500:.1f}x the whole bucket.")
print(f"  Verdict: the bucket is absurd at month 1, not at some future month. Reinvestment budget at m0 "
      f"(75% x $130k = $97.5k) covers under a third of the $333k/mo lead bill at $60/call - "
      f"lead spend must be priced into unit economics (agent comp), not funded from reinvestment.")

# --------- 3. CASH ENGINE (base case detail) ---------
print("\n"+"="*100)
print("3. CASH ENGINE - base case monthly view (25k/agent, persistency 70%, CPL $60, share held at calibrated "
      f"{share:.1%})")
print("="*100)
print(f"{'mo':>3} {'AP':>6} {'commCash':>9} {'agentPay':>9} {'leads':>7} {'chgbk':>6} {'rent':>6} {'ovhd':>6} "
      f"{'recr':>6} {'capex':>6} {'net':>7} {'draw':>6} {'reserve':>8}   ($M)")
for r in rows:
    print(f"{r['t']:>3} {r['ap']/1e6:>6.2f} {r['rev']/1e6:>9.3f} {r['agent']/1e6:>9.3f} {r['leads']/1e6:>7.3f} "
          f"{r['cb']/1e6:>6.3f} {r['rent']/1e6:>6.3f} {r['oh']/1e6:>6.3f} {r['rec']/1e6:>6.3f} "
          f"{r['capex']/1e6:>6.3f} {r['net']/1e6:>7.3f} {r['dist']/1e6:>6.3f} {r['reserve']/1e6:>8.3f}")
s0 = summarize(H, rows)
print(f"  30-mo operating cash generated: ${s0['cum_net']/1e6:.1f}M   owner draws: ${s0['cum_dist']/1e6:.1f}M   "
      f"min reserve: ${s0['trough']/1e6:.2f}M (month {s0['trough_m']})")

# growth hangover: freeze AP at month-30 level for 12 more months
Ph = copy.deepcopy(P0); Ph['T']=42
ap42 = [P0['ap0']*(P0['ap30']/P0['ap0'])**(min(t,30)/30) for t in range(43)]
Hh,PEh,hdh,_ = agent_engine(Ph, ap42)
rows42 = cash_engine(Ph, share, ap42, Hh, PEh, hdh)
post = [r for r in rows42 if r['t']>30]
print(f"  Growth hangover check: freeze AP at $25M after m30 -> avg net m31-42 = "
      f"${sum(r['net'] for r in post)/12/1e6:.2f}M/mo ({sum(r['net'] for r in post)/12/25e6:.1%} of AP) "
      f"vs ${rows[-1]['net']/1e6:.2f}M in m30. Advances flatter growth; chargebacks land after it stops.")

# --------- 4. VERDICT TABLE ---------
def verdict(cpl):
    out=[]
    for apa in [15_000,20_000,25_000]:
        for p in [0.60,0.70,0.80]:
            Pv = copy.deepcopy(BASE); Pv['ap_per_agent']=apa; Pv['persistency']=p; Pv['cpl']=cpl
            apx,Hx,PEx,hdx,rx = run(Pv, share)
            sm = summarize(Hx, rx)
            cp = constrained_path(Pv, share)
            out.append((apa,p,sm,cp[-1]))
    return out

for cpl in [60.0, 75.0]:
    print("\n"+"="*100)
    print(f"4. VERDICT TABLE - CPL ${cpl:.0f}/qualified call, agent share held at calibrated {share:.1%}")
    print("="*100)
    print(f"{'AP/agent':>9} {'persist':>8} {'peak recruits':>13} {'peak ad $/mo':>12} {'trough mo':>9} "
          f"{'trough $M':>10} {'ext capital':>11} {'m30 AP (capped reinvest)':>24}")
    for apa,p,sm,ap30c in verdict(cpl):
        ec = f"${sm['ext_cap']/1e6:.2f}M" if sm['ext_cap']>1e4 else "none"
        print(f"{apa/1e3:>7.0f}k {p:>8.0%} {sm['peak_recruits']:>13.0f} {sm['peak_leads']/1e6:>11.2f}M "
              f"{sm['trough_m']:>9} {sm['trough']/1e6:>10.2f} {ec:>11} {ap30c/1e6:>21.1f}M")

# --------- 5. TORNADO ---------
print("\n"+"="*100)
print("5. TORNADO - single-assumption swing on 30-month cumulative operating cash (base = 25k/70%/CPL$60)")
print("   (agent share held at calibrated value; each row varies ONE assumption to its bounds)")
print("="*100)
base_cum = s0['cum_net']
tornado = [
    ('cpl', 45.0, 75.0, 'CPL $/qualified call 45-75'),
    ('persistency', 0.60, 0.80, '13-mo persistency 60-80%'),
    ('ap_per_agent', 15_000.0, 25_000.0, 'AP/productive agent 15k-25k (base=25k)'),
    ('close_rate', 0.15, 0.25, 'close rate 15-25%'),
    ('adv_frac', 0.65, 0.85, 'advance rate 65-85%'),
    ('ret90', 0.50, 0.70, '90-day retention 50-70%'),
    ('mature_attr', 0.06, 0.03, 'mature attrition 6-3%/mo'),
    ('cb_sev', 0.35, 0.15, 'chargeback severity 35-15%'),
    ('ramp_factor', 0.30, 0.50, 'month-1 ramp 30-50%'),
    ('launch_capex', 70_000.0, 40_000.0, 'office launch capex 70-40k'),
    ('oh_per_agent', 900.0, 400.0, 'overhead/agent 900-400'),
]
res=[]
for key, lo, hi, label in tornado:
    cums=[]
    for v in (lo,hi):
        Pt = copy.deepcopy(BASE); Pt[key]=v
        _,Ht,_,_,rt = run(Pt, share)
        cums.append(sum(r['net'] for r in rt))
    res.append((label, cums[0]-base_cum, cums[1]-base_cum, abs(cums[1]-cums[0])))
res.sort(key=lambda x:-x[3])
print(f"  Base 30-mo cumulative operating cash: ${base_cum/1e6:.1f}M")
print(f"  {'assumption (low-high bound)':<40} {'low delta':>11} {'high delta':>11} {'swing':>9}")
for label, dlo, dhi, sw in res:
    print(f"  {label:<40} {dlo/1e6:>+10.1f}M {dhi/1e6:>+10.1f}M {sw/1e6:>8.1f}M")
