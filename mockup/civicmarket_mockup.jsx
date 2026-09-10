import { useState } from "react";

// ---------- Design tokens (from CivicMarket Design System v2) ----------
const T = {
  black: "#0D1117",
  bgApp: "#F6F8FA",
  card: "#FFFFFF",
  subtle: "#F3F4F6",
  teal: "#00C9A7",
  tealDeep: "#00A688",
  tealSoft: "#E6FAF6",
  coral: "#FF6B6B",
  coralSoft: "#FEF2F2",
  amber: "#F59E0B",
  amberSoft: "#FFFBEB",
  indigo: "#4338CA",
  indigoSoft: "#EEF2FF",
  s900: "#0D1117",
  s700: "#374151",
  s500: "#6B7280",
  s400: "#9CA3AF",
  s200: "#E5E7EB",
};
const display = { fontFamily: "'Syne', sans-serif" };
const body = { fontFamily: "'Instrument Sans', sans-serif" };

// ---------- The eight categories ----------
const CATS = {
  growth_development: "Growth",
  taxes_budget: "Taxes",
  infrastructure_traffic: "Traffic",
  housing_affordability: "Housing",
  public_safety: "Safety",
  economic_development: "Jobs",
  environment_land: "Land",
  accountability_influence: "Accountability",
};

// ---------- Reputation ladder (gated by verified acts) ----------
const LEVELS = [
  { name: "Newcomer", icon: "👋", pts: 0, gate: "Sign up" },
  { name: "Resident", icon: "🏡", pts: 0, gate: "Verify your address" },
  { name: "Voter", icon: "🗳️", pts: 50, gate: "Pick your issues, weigh in on 3 items" },
  { name: "Neighbor", icon: "🤝", pts: 150, gate: "5 helpful comments, 30 days active" },
  { name: "Watchdog", icon: "🔎", pts: 300, gate: "1 accepted correction or 1 check-in" },
  { name: "Advocate", icon: "🎤", pts: 600, gate: "Speak at public comment" },
  { name: "Delegate", icon: "🏛️", pts: 1500, gate: "3 speeches, 3 corrections, 6 months" },
  { name: "Titan", icon: "⬡", pts: 5000, gate: "10 speeches, 10 corrections, 2 years" },
];
const LEVEL_COLOR = { Newcomer: T.s400, Resident: T.s500, Voter: T.s700, Neighbor: "#0E7490", Watchdog: "#B45309", Advocate: "#059669", Delegate: T.indigo, Titan: "#7C3AED" };

// Candidate takes on live items (shown, never counted)
const CANDIDATE_TAKES = {
  1: [
    { cand: "a", stance: "support", text: "With a binding traffic study and impact fees up front, yes. We need starter homes and this is the last large parcel." },
    { cand: "b", stance: "oppose", text: "No. Conservation land stays conservation land until Becker Road is widened, and it isn't." },
  ],
  2: [{ cand: "a", stance: "support", text: "Deferred pipes cost more later. I'd vote yes." }],
};

// ---------- Fictional feed data (shape matches civic_feed) ----------
const FEED = [
  {
    id: 1,
    title: "Rezoning of 42 acres near Becker Road",
    body: "A developer is asking to change 42 acres from conservation to residential to build about 210 homes. Staff recommends approval with a traffic study.",
    meeting: "City Council",
    date: "Mon, Sep 14",
    time: "6:00 PM",
    location: "City Hall, Council Chambers",
    address: "121 SW Port St. Lucie Blvd",
    tags: ["growth_development", "environment_land", "infrastructure_traffic"],
    area: "Southwest PSL",
    urgency: "major",
    money: { label: "Applicant", value: "Sandpiper Land Partners", note: "Donated to 2 sitting council members in 2024" },
    rating: { avg: 4.6, count: 182 },
    support: 41,
    oppose: 118,
    unsure: 23,
    outcome: null,
    source: "cityofpsl.com/agendas/2026-09-14",
  },
  {
    id: 2,
    title: "3% increase to water and sewer rates",
    body: "Utility rates would rise about $4.10 per month for a typical household starting October 1, to fund pipe replacement in older neighborhoods.",
    meeting: "City Council",
    date: "Mon, Sep 14",
    time: "6:00 PM",
    location: "City Hall, Council Chambers",
    address: "121 SW Port St. Lucie Blvd",
    tags: ["taxes_budget", "infrastructure_traffic"],
    area: "Citywide",
    urgency: "significant",
    money: { label: "Cost to you", value: "≈ $49 / year", note: "Funds $18M of pipe replacement" },
    rating: { avg: 3.4, count: 158 },
    support: 66,
    oppose: 52,
    unsure: 40,
    outcome: null,
    source: "cityofpsl.com/agendas/2026-09-14",
  },
  {
    id: 3,
    title: "Design contract for Crosstown Parkway extension",
    body: "The county would pay an engineering firm $1.2M to design the next phase of the parkway. Construction funding is not part of this vote.",
    meeting: "County Commission",
    date: "Wed, Sep 16",
    time: "9:00 AM",
    location: "County Administration Bldg",
    address: "2300 Virginia Ave, Fort Pierce",
    tags: ["infrastructure_traffic", "economic_development"],
    area: "East PSL",
    urgency: "routine",
    money: { label: "Contract", value: "$1.2M", note: "Awarded without competitive bid" },
    rating: { avg: 2.9, count: 133 },
    support: 88,
    oppose: 14,
    unsure: 31,
    outcome: null,
    source: "stlucieco.gov/agendas/2026-09-16",
  },
  {
    id: 4,
    title: "Funding for a new police substation on Port St. Lucie Blvd",
    body: "Council approved $6.4M for a substation intended to cut response times on the east side by about four minutes.",
    meeting: "City Council",
    date: "Mon, Aug 24",
    time: "6:00 PM",
    location: "City Hall, Council Chambers",
    address: "121 SW Port St. Lucie Blvd",
    tags: ["public_safety", "taxes_budget"],
    area: "East PSL",
    urgency: "significant",
    money: { label: "Cost", value: "$6.4M", note: "From general fund reserves" },
    rating: { avg: 4.1, count: 180 },
    support: 140,
    oppose: 22,
    unsure: 18,
    outcome: "Passed 4–1",
    outcomeDetail: "Yes: Bowen, Carrasco, Lin, Okafor · No: Pruitt",
    minutes: "cityofpsl.com/minutes/2026-08-24",
    source: "cityofpsl.com/minutes/2026-08-24",
  },
];

// ---------- Fictional candidates (shape matches candidate_positions + evidence) ----------
const CANDIDATES = [
  {
    id: "a",
    name: "Dana Whitfield",
    office: "City Council, District 1",
    incumbent: false,
    coverage: 5,
    match: 74,
    rating: { avg: 4.2, count: 63 },
    line: "Strong agreement on traffic and accountability. You differ on growth.",
    positions: {
      growth_development: { score: 2, label: "Strongly favors more building", src: "Campaign site", date: "Jul 2, 2026", excerpt: "We will approve the housing this city needs instead of saying no to every project.", url: "danaforpsl.example" },
      taxes_budget: { score: -1, label: "Leans toward lower taxes", src: "Interview, TCPalm", date: "Aug 9, 2026", excerpt: "I'm not going to raise your millage rate to fund things we can defer.", url: "tcpalm.example" },
      infrastructure_traffic: { score: 2, label: "Strongly favors investing now", src: "Campaign site", date: "Jul 2, 2026", excerpt: "Crosstown and Becker fixes cannot wait another decade. Borrow and build.", url: "danaforpsl.example" },
      housing_affordability: null,
      public_safety: { score: 1, label: "Leans toward more policing", src: "Debate", date: "Aug 20, 2026", excerpt: "Yes, more officers on the east side, and I've said so at every forum.", url: "psl-forum.example" },
      economic_development: null,
      environment_land: null,
      accountability_influence: { score: 1, label: "Leans toward stronger rules", src: "Questionnaire", date: "Aug 30, 2026", excerpt: "Candidate answer: Agree", url: "" },
    },
  },
  {
    id: "b",
    name: "Marcus Bell",
    office: "City Council, District 1",
    incumbent: false,
    coverage: 3,
    match: null,
    rating: { avg: 3.6, count: 41 },
    line: "Not enough public positions yet to compute a match.",
    positions: {
      growth_development: { score: -2, label: "Strongly favors slowing growth", src: "Campaign site", date: "Jun 18, 2026", excerpt: "Enough. Our roads and schools are full. No new approvals until infrastructure catches up.", url: "bellforcouncil.example" },
      taxes_budget: null,
      infrastructure_traffic: { score: 1, label: "Leans toward investing now", src: "Public meeting", date: "Jul 27, 2026", excerpt: "I'd support a bond if every dollar is tied to a named road project.", url: "cityofpsl.example" },
      housing_affordability: null,
      public_safety: null,
      economic_development: null,
      environment_land: { score: 2, label: "Strongly favors preserving land", src: "News article", date: "Aug 3, 2026", excerpt: "Conservation land should stay conservation land. Period.", url: "tcpalm.example" },
      accountability_influence: null,
    },
  },
];

const USER = {
  name: "Mike",
  area: "Southwest PSL",
  topIssues: ["infrastructure_traffic", "environment_land", "accountability_influence"],
  dna: { growth_development: -0.5, taxes_budget: 0, infrastructure_traffic: 2, housing_affordability: 1, public_safety: 0, economic_development: 0.5, environment_land: 1.5, accountability_influence: 2 },
};

// ---------- Small components ----------
function Stars({ value, count, size = 14, onRate, mine }) {
  const shown = mine ?? value;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <div style={{ display: "flex", gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            onClick={onRate ? () => onRate(i) : undefined}
            style={{ fontSize: size, color: i <= Math.round(shown) ? T.amber : T.s200, cursor: onRate ? "pointer" : "default", lineHeight: 1 }}
          >
            ★
          </span>
        ))}
      </div>
      <span style={{ ...display, fontSize: size - 1, fontWeight: 700, color: T.s900 }}>{shown.toFixed(1)}</span>
      {count != null && <span style={{ ...body, fontSize: size - 3, color: T.s400 }}>({count})</span>}
    </div>
  );
}

function Tag({ k, active }) {
  return (
    <span
      style={{
        ...body,
        fontSize: 11,
        fontWeight: 600,
        padding: "4px 9px",
        borderRadius: 999,
        background: active ? T.tealSoft : T.subtle,
        color: active ? T.tealDeep : T.s500,
      }}
    >
      {CATS[k]}
    </span>
  );
}

function Ring({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = score == null ? T.s200 : score >= 70 ? T.teal : score >= 45 ? T.amber : T.coral;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={T.s200} strokeWidth="6" fill="none" />
        {score != null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * c} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
        {score == null && <circle cx={size / 2} cy={size / 2} r={r} stroke={T.s400} strokeWidth="2" fill="none" strokeDasharray="4 4" />}
      </svg>
      <div style={{ ...display, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: score == null ? 11 : 15, color: score == null ? T.s400 : T.s900 }}>
        {score == null ? "?" : score}
      </div>
    </div>
  );
}

function DarkHeader({ title, sub, right, onBack }) {
  return (
    <div style={{ background: T.black, padding: "52px 20px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -60, right: -40, width: 180, height: 180, borderRadius: 999, background: T.teal, opacity: 0.18, filter: "blur(30px)" }} />
      {onBack && (
        <button onClick={onBack} style={{ ...body, background: "none", border: "none", color: T.teal, fontSize: 14, padding: 0, marginBottom: 10, cursor: "pointer" }}>
          ← Back
        </button>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ ...display, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>{title}</div>
          {sub && <div style={{ ...body, fontSize: 13, color: T.s400, marginTop: 4 }}>{sub}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}

function Card({ children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      style={{ background: T.card, borderRadius: 20, padding: 16, boxShadow: "0 1px 2px rgba(13,17,23,0.04)", cursor: onClick ? "pointer" : "default", ...style }}
    >
      {children}
    </div>
  );
}

function Urgency({ u }) {
  const map = { major: [T.coralSoft, T.coral, "Big decision"], significant: [T.amberSoft, "#B45309", "Worth a look"], routine: [T.subtle, T.s500, "Routine"] };
  const [bg, fg, label] = map[u];
  return <span style={{ ...body, fontSize: 11, fontWeight: 600, background: bg, color: fg, padding: "4px 9px", borderRadius: 999 }}>{label}</span>;
}

// ---------- Verify sheet (used in onboarding and at first comment) ----------
function VerifySheet({ onDone, onSkip, inline }) {
  const [addr, setAddr] = useState("");
  const [err, setErr] = useState("");
  const inner = (
    <>
      <div style={{ ...display, fontSize: 20, fontWeight: 800, color: T.s900, lineHeight: 1.2 }}>Prove you live here</div>
      <div style={{ ...body, fontSize: 14, color: T.s700, lineHeight: 1.5, marginTop: 8 }}>
        Comments and votes only count when they come from real Port St. Lucie residents. We check your address against USPS. It's never shown, never sold, never shared with a campaign.
      </div>
      <ObInput value={addr} set={setAddr} placeholder="Street address (e.g. 1234 SW Becker Rd)" err={err} setErr={setErr} />
      <div style={{ ...body, fontSize: 11, color: T.s400, marginTop: 6 }}>Unlocks: ● ● ○ Verified resident · +25 points</div>
      <Btn label="Verify my address" onClick={() => { if (!/\d+\s+\S+/.test(addr)) return setErr("Enter a street address with a house number."); onDone(); }} />
      {onSkip && <Btn label="Later" ghost onClick={onSkip} />}
    </>
  );
  if (inline) return <Card style={{ border: `1.5px solid ${T.teal}` }}>{inner}</Card>;
  return inner;
}


// ---------- Report an inaccuracy ----------
function ReportSheet({ subject, prefill, onClose }) {
  const [kind, setKind] = useState(prefill?.kind || "");
  const [what, setWhat] = useState("");
  const [src, setSrc] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const kinds = prefill?.kinds || ["A fact is wrong", "The source doesn't say this", "Missing context", "Something else"];
  const needsSource = kind === "The source doesn't say this" || kind === "The position is wrong";

  if (sent)
    return (
      <Card style={{ border: `1.5px solid ${T.teal}` }}>
        <div style={{ ...display, fontSize: 18, fontWeight: 800, color: T.s900 }}>Got it. Here's what happens next.</div>
        {[["Now", "Report logged. Case #C-0417."], ["48 hours", "We acknowledge and tell you who's reviewing."], ["7 days", "We check the source and decide: correct, keep, or set to \"no position found.\""], ["Decision", "You get the result and the reason. Any change appears in the public change log."], ["Appeal", "Disagree? One appeal, reviewed by a second person."]].map(([t, d]) => (
          <div key={t} style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <div style={{ ...display, fontSize: 11, fontWeight: 800, color: T.tealDeep, width: 60, flexShrink: 0, paddingTop: 2 }}>{t}</div>
            <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.45 }}>{d}</div>
          </div>
        ))}
        <div style={{ ...body, fontSize: 12, color: T.s500, marginTop: 12, lineHeight: 1.5 }}>If we agree with you, you earn a <strong>✓ Correction accepted</strong> badge and 100 points. If a report is made in bad faith, it costs 15.</div>
        <Btn label="Done" ghost onClick={onClose} />
      </Card>
    );

  return (
    <Card style={{ border: `1.5px solid ${T.coral}` }}>
      <div style={{ ...display, fontSize: 18, fontWeight: 800, color: T.s900 }}>Report an inaccuracy</div>
      <div style={{ ...body, fontSize: 13, color: T.s500, marginTop: 4 }}>{subject}</div>
      <div style={{ ...display, fontSize: 12, fontWeight: 700, color: T.s500, marginTop: 14, marginBottom: 6 }}>What's wrong?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {kinds.map((k) => (
          <button key={k} onClick={() => { setKind(k); setErr(""); }} style={{ ...body, fontSize: 12, fontWeight: 600, padding: "8px 12px", borderRadius: 999, border: `1.5px solid ${kind === k ? T.coral : T.s200}`, background: kind === k ? T.coralSoft : "#fff", color: kind === k ? T.coral : T.s700, cursor: "pointer" }}>{k}</button>
        ))}
      </div>
      <textarea value={what} onChange={(e) => { setWhat(e.target.value); setErr(""); }} placeholder="Tell us what you found. Be specific: which sentence, which number, which vote." rows={3}
        style={{ ...body, width: "100%", boxSizing: "border-box", border: `1.5px solid ${T.s200}`, borderRadius: 14, padding: 10, fontSize: 14, resize: "none", outline: "none", marginTop: 12 }} />
      <input value={src} onChange={(e) => { setSrc(e.target.value); setErr(""); }} placeholder={needsSource ? "Source link (required for this kind of report)" : "Source link, if you have one"}
        style={{ ...body, width: "100%", boxSizing: "border-box", border: `1.5px solid ${err && needsSource && !src ? T.coral : T.s200}`, borderRadius: 14, padding: "12px 14px", fontSize: 14, outline: "none", marginTop: 8 }} />
      {err && <div style={{ ...body, fontSize: 12, color: T.coral, marginTop: 6 }}>{err}</div>}
      <div style={{ ...body, fontSize: 11, color: T.s400, marginTop: 8, lineHeight: 1.5 }}>You can dispute facts, sources, and how a position was read. You can't dispute neighbor votes, ratings, or match scores; those are the community's, not ours.</div>
      <Btn label="Send report" onClick={() => {
        if (!kind) return setErr("Pick what's wrong.");
        if (what.trim().length < 15) return setErr("Give us at least a sentence.");
        if (needsSource && !src.trim()) return setErr("This kind of report needs a source link we can check.");
        setSent(true);
      }} />
      <Btn label="Cancel" ghost onClick={onClose} />
    </Card>
  );
}

// ---------- Comments (fictional) ----------
const COMMENTS = {
  "item-1": {
    summary: ["Most neighbors worry about Becker Road traffic more than the homes themselves.", "Several people asked whether the conservation designation was ever meant to be permanent.", "A few supporters say PSL needs starter homes and this is the only large parcel left."],
    list: [
      { id: 1, who: "Rosa M.", level: "Advocate", verified: true, priority: true, acts: ["spoke"], text: "Becker already backs up to the turnpike ramp at 5pm. 210 more driveways with no widening is not a plan, it's a wish.", up: 64, down: 3 },
      { id: 2, who: "Jay T.", level: "Neighbor", verified: true, text: "I read the staff report. The traffic study is required AFTER approval. That's backwards.", up: 41, down: 5 },
      { id: 3, who: "Priya K.", level: "Voter", verified: true, text: "My kids can't afford to live in the city they grew up in. Somebody has to build something.", up: 22, down: 17 },
      { id: 4, who: "Dale W.", level: "Watchdog", verified: true, priority: true, acts: ["correction"], text: "Wasn't this parcel donated as conservation in the 90s? Does anyone have the deed language?", up: 30, down: 1 },
    ],
  },
  "item-2": {
    summary: ["Neighbors mostly accept the increase but want to see the pipe-replacement map first.", "Older east-side neighborhoods are the most supportive.", "Several asked why reserves aren't being used instead."],
    list: [
      { id: 1, who: "Ken B.", level: "Neighbor", verified: true, priority: true, acts: ["checkin"], text: "$4 a month to stop the boil-water notices on my street? Yes. Show me the map though.", up: 38, down: 4 },
      { id: 2, who: "Ana L.", level: "Resident", verified: true, text: "We just paid for a substation out of reserves. Why can't pipes come from reserves too?", up: 29, down: 6 },
    ],
  },
  "item-3": {
    summary: ["Broad support for the extension itself.", "The no-bid contract is the main concern raised."],
    list: [{ id: 1, who: "Marcus D.", level: "Delegate", verified: true, acts: ["spoke"], text: "Extension is overdue. But $1.2M without a competitive bid needs a public explanation.", up: 45, down: 2 }],
  },
  "item-4": {
    summary: ["Neighbors on the east side are relieved.", "Some question the four-minute response claim."],
    list: [{ id: 1, who: "Tanya R.", level: "Neighbor", verified: true, priority: true, acts: ["checkin"], text: "Waited 14 minutes for a unit last spring. Glad this passed.", up: 51, down: 2 }],
  },
  "cand-a": {
    summary: ["Neighbors who met her say she answers questions directly.", "Concern that she has not said where she stands on housing or land.", "Supporters point to her traffic plan as the most specific of any candidate."],
    list: [
      { id: 1, who: "Rosa M.", level: "Advocate", verified: true, priority: true, text: "Asked her at the Tradition forum about Becker Road. She gave a real answer with a dollar figure. Nobody else did.", up: 58, down: 4 },
      { id: 2, who: "Dale W.", level: "Watchdog", verified: true, text: "Her site says nothing about conservation land. That's the biggest issue in District 1. Why?", up: 33, down: 2 },
    ],
  },
  "cand-b": {
    summary: ["Seen as the slow-growth candidate.", "Several neighbors want to hear his position on taxes before deciding."],
    list: [{ id: 1, who: "Jay T.", level: "Neighbor", verified: true, text: "He's the only one who said no to the Becker rezoning outright. That's my vote unless he flips.", up: 40, down: 9 }],
  },
};

function Comments({ target, gate, priorityLabel, verified, onVerify }) {
  const canComment = verified;
  const [showVerify, setShowVerify] = useState(false);
  const data = COMMENTS[target] || { summary: [], list: [] };
  const [list, setList] = useState(data.list);
  const [my, setMy] = useState({});
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState("");
  const [sort, setSort] = useState("helpful");

  const vote = (id, dir) => {
    const prev = my[id];
    const next = prev === dir ? null : dir;
    setMy({ ...my, [id]: next });
    setList(
      list.map((c) => {
        if (c.id !== id) return c;
        let { up, down } = c;
        if (prev === "up") up--;
        if (prev === "down") down--;
        if (next === "up") up++;
        if (next === "down") down++;
        return { ...c, up, down };
      })
    );
  };

  const post = () => {
    if (!draft.trim()) {
      setErr("Write something first.");
      return;
    }
    setList([{ id: Date.now(), who: `${USER.name} W.`, level: "Watchdog", verified: true, priority: true, text: draft.trim(), up: 0, down: 0, mine: true }, ...list]);
    setDraft("");
    setErr("");
  };

  const weight = (c) => (c.up - c.down) * (c.priority ? 2 : 1);
  const sorted = [...list].sort((a, b) => (sort === "helpful" ? weight(b) - weight(a) : b.id - a.id));

  return (
    <>
      <Card style={{ background: T.indigoSoft }}>
        <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.indigo, marginBottom: 8 }}>What neighbors are saying · summary of {list.length} comments</div>
        {data.summary.map((s, i) => (
          <div key={i} style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5, display: "flex", gap: 8, marginBottom: 4 }}>
            <span style={{ color: T.indigo }}>•</span>
            <span>{s}</span>
          </div>
        ))}
        <div style={{ ...body, fontSize: 11, color: T.s400, marginTop: 6 }}>Summarized by AI from verified residents' comments. Comments from the {priorityLabel.toLowerCase()} count double. Updated hourly.</div>
      </Card>

      <Card>
        <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 4 }}>Add your take</div>
        <div style={{ ...body, fontSize: 12, color: canComment ? T.tealDeep : T.s400, marginBottom: 8 }}>{canComment ? "✓ " : "🔒 "}{gate}</div>
        {!canComment && !showVerify && (
          <button onClick={() => setShowVerify(true)} style={{ ...display, padding: "10px 18px", borderRadius: 999, border: "none", background: T.teal, color: T.black, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Verify my address to comment
          </button>
        )}
        {!canComment && showVerify && <VerifySheet inline onDone={() => { onVerify(); setShowVerify(false); }} onSkip={() => setShowVerify(false)} />}
        {canComment && (<>
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (err) setErr("");
          }}
          placeholder="What do you know about this that your neighbors don't?"
          rows={2}
          style={{ ...body, width: "100%", boxSizing: "border-box", border: `1.5px solid ${err ? T.coral : T.s200}`, borderRadius: 14, padding: 10, fontSize: 14, resize: "none", outline: "none" }}
        />
        {err && <div style={{ ...body, fontSize: 12, color: T.coral, marginTop: 4 }}>{err}</div>}
        <button onClick={post} style={{ ...display, marginTop: 8, padding: "10px 18px", borderRadius: 999, border: "none", background: T.teal, color: T.black, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          Post comment
        </button>
        </>)}
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
        <span style={{ ...display, fontSize: 14, fontWeight: 700, color: T.s700 }}>{list.length} comments</span>
        <div style={{ display: "flex", gap: 4 }}>
          {["helpful", "newest"].map((s) => (
            <button key={s} onClick={() => setSort(s)} style={{ ...body, fontSize: 12, fontWeight: 600, padding: "5px 10px", borderRadius: 999, border: "none", background: sort === s ? T.s900 : T.subtle, color: sort === s ? "#fff" : T.s500, cursor: "pointer", textTransform: "capitalize" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {sorted.map((c) => (
        <Card key={c.id} style={c.mine ? { border: `1.5px solid ${T.teal}` } : {}}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s900 }}>{c.who}</span>
            <span style={{ ...body, fontSize: 10, fontWeight: 700, color: LEVEL_COLOR[c.level], background: T.subtle, padding: "2px 7px", borderRadius: 999 }}>{LEVELS.find((l) => l.name === c.level)?.icon} {c.level}</span>
            {c.verified ? (
              <span style={{ ...body, fontSize: 10, color: T.tealDeep }}>● verified</span>
            ) : (
              <span style={{ ...body, fontSize: 10, color: T.s400 }}>○ unverified</span>
            )}
            {c.priority && <span style={{ ...body, fontSize: 10, fontWeight: 700, color: T.indigo, background: T.indigoSoft, padding: "2px 7px", borderRadius: 999 }}>{priorityLabel}</span>}
            {c.acts?.includes("spoke") && <span style={{ ...body, fontSize: 10, fontWeight: 700, color: "#065F46", background: T.tealSoft, padding: "2px 7px", borderRadius: 999 }}>🎤 Spoke on this</span>}
            {c.acts?.includes("checkin") && <span style={{ ...body, fontSize: 10, fontWeight: 700, color: "#92400E", background: T.amberSoft, padding: "2px 7px", borderRadius: 999 }}>📍 Checked in</span>}
            {c.acts?.includes("correction") && <span style={{ ...body, fontSize: 10, fontWeight: 700, color: "#92400E", background: T.amberSoft, padding: "2px 7px", borderRadius: 999 }}>✓ Correction accepted</span>}
          </div>
          <div style={{ ...body, fontSize: 14, color: T.s900, lineHeight: 1.5 }}>{c.text}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
            <button onClick={() => vote(c.id, "up")} style={{ ...body, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: `1.5px solid ${my[c.id] === "up" ? T.teal : T.s200}`, background: my[c.id] === "up" ? T.tealSoft : "#fff", color: my[c.id] === "up" ? T.tealDeep : T.s700, cursor: "pointer" }}>
              👍 Helpful · {c.up}
            </button>
            <button onClick={() => vote(c.id, "down")} style={{ ...body, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999, border: `1.5px solid ${my[c.id] === "down" ? T.coral : T.s200}`, background: my[c.id] === "down" ? T.coralSoft : "#fff", color: my[c.id] === "down" ? T.coral : T.s700, cursor: "pointer" }}>
              👎 {c.down}
            </button>
            <span style={{ ...body, fontSize: 11, color: T.s400, marginLeft: "auto" }}>Report</span>
          </div>
        </Card>
      ))}
    </>
  );
}


// ---------- Alerts ----------
const ALERTS = [
  { id: 1, when: "Today", kind: "issue", icon: "🔎", title: "New item on Land: rezoning near Becker Road", sub: "City Council · Mon, Sep 14 · 42 acres, conservation to residential", itemId: 1, unread: true },
  { id: 2, when: "Today", kind: "area", icon: "📍", title: "In Southwest PSL: Becker Road rezoning", sub: "Neighbors in your area are 3-to-1 opposed so far", itemId: 1, unread: true },
  { id: 3, when: "Today", kind: "candidate", icon: "🗳️", title: "Dana Whitfield weighed in on Becker Road", sub: "Supports, with conditions. Marcus Bell opposes.", itemId: 1, unread: true },
  { id: 4, when: "This week", kind: "issue", icon: "🔎", title: "New item on Traffic: Crosstown Parkway design contract", sub: "County Commission · Wed, Sep 16 · $1.2M, no competitive bid", itemId: 3, unread: false },
  { id: 5, when: "This week", kind: "reminder", icon: "⏰", title: "Meeting tomorrow at 6 PM", sub: "City Council · 2 items you're following · Public comment sign-up at 5:45", itemId: 1, unread: false },
  { id: 6, when: "This week", kind: "outcome", icon: "✅", title: "What happened: police substation passed 4–1", sub: "You said Support. 87% of your neighbors agreed.", itemId: 4, unread: false },
  { id: 7, when: "Earlier", kind: "you", icon: "🔎", title: "You're now a Watchdog", sub: "Your correction on the Aug 24 minutes was accepted. +100 points.", itemId: null, unread: false },
  { id: 8, when: "Earlier", kind: "you", icon: "💬", title: "Rosa M. replied to your comment", sub: "\"Agreed on the turnpike ramp, but have you seen the staff traffic memo?\"", itemId: 1, unread: false },
];

function Alerts({ back, open, read, markRead }) {
  const groups = ["Today", "This week", "Earlier"];
  return (
    <div>
      <DarkHeader
        title="Alerts"
        sub="Only what touches your issues, your area, or you"
        onBack={back}
        right={<button onClick={() => markRead(ALERTS.map((a) => a.id))} style={{ ...body, fontSize: 12, background: "none", border: `1px solid ${T.s700}`, color: T.s400, padding: "6px 10px", borderRadius: 999, cursor: "pointer" }}>Mark all read</button>}
      />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {groups.map((g) => (
          <div key={g}>
            <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 8 }}>{g}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ALERTS.filter((a) => a.when === g).map((a) => {
                const unread = a.unread && !read.includes(a.id);
                return (
                  <Card key={a.id} onClick={() => { markRead([a.id]); if (a.itemId) open(FEED.find((f) => f.id === a.itemId)); }} style={{ padding: 14, borderLeft: `4px solid ${unread ? T.teal : "transparent"}` }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: T.subtle, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...display, fontSize: 14, fontWeight: unread ? 800 : 700, color: T.s900, lineHeight: 1.3 }}>{a.title}</div>
                        <div style={{ ...body, fontSize: 12, color: T.s500, lineHeight: 1.45, marginTop: 3 }}>{a.sub}</div>
                      </div>
                      {unread && <div style={{ width: 8, height: 8, borderRadius: 999, background: T.teal, marginTop: 6 }} />}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
        <div style={{ ...body, fontSize: 12, color: T.s400, textAlign: "center", lineHeight: 1.6, marginTop: 6 }}>
          You get alerts for your 3 issues, your neighborhood, meetings you follow, and replies to you.
          <br />
          <span style={{ color: T.tealDeep }}>Change what you're alerted about</span>
        </div>
      </div>
    </div>
  );
}


// ---------- City Hall check-in ----------
function CheckInSheet({ onClose, onCheckedIn, checkedIn }) {
  const [phase, setPhase] = useState(checkedIn ? "done" : "ask"); // ask | locating | far | done
  const [atHall, setAtHall] = useState(true); // demo switch

  const locate = () => {
    setPhase("locating");
    setTimeout(() => setPhase(atHall ? "done" : "far"), 900);
    if (atHall) setTimeout(onCheckedIn, 900);
  };

  return (
    <Card style={{ border: `1.5px solid ${T.teal}` }}>
      {phase === "ask" && (
        <>
          <div style={{ ...display, fontSize: 18, fontWeight: 800, color: T.s900 }}>You're at City Hall?</div>
          <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5, marginTop: 6 }}>
            Check in to show neighbors you showed up. We use your location once, right now, and only to confirm you're inside City Hall during the meeting. Nothing is stored.
          </div>
          <div style={{ ...body, fontSize: 12, color: T.s500, marginTop: 10, lineHeight: 1.5 }}>Open now: 6:00 PM to adjournment (+30 min). One check-in per meeting. Watching the livestream? That doesn't count for this badge, and that's on purpose.</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12, padding: 10, background: T.amberSoft, borderRadius: 12 }}>
            <span style={{ ...body, fontSize: 11, color: "#92400E" }}>Demo: pretend I'm</span>
            {[["at City Hall", true], ["at home", false]].map(([l, v]) => (
              <button key={l} onClick={() => setAtHall(v)} style={{ ...body, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, border: "none", background: atHall === v ? "#92400E" : "#fff", color: atHall === v ? "#fff" : "#92400E", cursor: "pointer" }}>{l}</button>
            ))}
          </div>
          <Btn label="Check in with my location" onClick={locate} />
          <Btn label="Not now" ghost onClick={onClose} />
        </>
      )}
      {phase === "locating" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: 32 }}>📍</div>
          <div style={{ ...display, fontSize: 15, fontWeight: 700, color: T.s900, marginTop: 8 }}>Checking your location…</div>
        </div>
      )}
      {phase === "far" && (
        <>
          <div style={{ ...display, fontSize: 18, fontWeight: 800, color: T.s900 }}>Doesn't look like City Hall</div>
          <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5, marginTop: 6 }}>You're about 4.2 miles from 121 SW Port St. Lucie Blvd. Check-in only works inside the building during the meeting.</div>
          <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5, marginTop: 8 }}>Watching from home? You can still weigh in and comment; those count the same.</div>
          <Btn label="Try again" onClick={() => setPhase("ask")} />
          <Btn label="Close" ghost onClick={onClose} />
        </>
      )}
      {phase === "done" && (
        <>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>📍</div>
            <div style={{ ...display, fontSize: 20, fontWeight: 800, color: T.s900, marginTop: 4 }}>Checked in at City Hall</div>
            <div style={{ ...body, fontSize: 13, color: T.tealDeep, fontWeight: 600, marginTop: 4 }}>+50 points · 23 neighbors here tonight</div>
          </div>
          <div style={{ background: T.subtle, borderRadius: 14, padding: 12, marginTop: 14 }}>
            <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s900 }}>Speaking tonight?</div>
            <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5, marginTop: 4 }}>Sign up at the clerk's desk before 6:00. After the minutes post, we match your name and add <strong>🎤 Spoke on this</strong> to your comment. Speaking is what unlocks Advocate.</div>
          </div>
          <div style={{ ...body, fontSize: 12, color: T.s500, marginTop: 10 }}>On tonight's agenda for you: Becker Road rezoning · Water and sewer rates</div>
          <Btn label="Back to the meeting" ghost onClick={onClose} />
        </>
      )}
    </Card>
  );
}

// ---------- Screens ----------
function Home({ open, votes, openAlerts, unread, checkedIn, onCheckedIn }) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const upcoming = FEED.filter((f) => !f.outcome);
  const decided = FEED.filter((f) => f.outcome);
  const forYou = (f) => f.tags.some((t) => USER.topIssues.includes(t)) || f.area === USER.area;
  return (
    <div>
      <DarkHeader
        title="Your backyard"
        sub={`${USER.area} · ${upcoming.length} decisions coming up`}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...body, fontSize: 12, background: "rgba(0,201,167,0.15)", color: T.teal, padding: "6px 10px", borderRadius: 999 }}>Nov 3 · 56 days</div>
            <button onClick={openAlerts} style={{ position: "relative", width: 36, height: 36, borderRadius: 999, border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 17, cursor: "pointer" }}>
              🔔
              {unread > 0 && <span style={{ ...display, position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 999, background: T.coral, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{unread}</span>}
            </button>
          </div>
        }
      />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {!showCheckIn ? (
          <Card onClick={() => setShowCheckIn(true)} style={{ background: checkedIn ? T.tealSoft : T.teal, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24 }}>{checkedIn ? "✓" : "🔴"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ ...display, fontSize: 14, fontWeight: 800, color: T.black }}>{checkedIn ? "You're checked in at City Hall" : "City Council is meeting now"}</div>
                <div style={{ ...body, fontSize: 12, color: T.s700, marginTop: 2 }}>{checkedIn ? "23 neighbors here · 2 of your items on the agenda" : "Started 6:00 PM · At City Hall? Check in to earn 📍"}</div>
              </div>
              <span style={{ ...display, fontSize: 12, fontWeight: 700, color: T.black }}>{checkedIn ? "Details" : "Check in"}</span>
            </div>
          </Card>
        ) : (
          <CheckInSheet onClose={() => setShowCheckIn(false)} onCheckedIn={onCheckedIn} checkedIn={checkedIn} />
        )}
        <div style={{ ...display, fontSize: 14, fontWeight: 700, color: T.s700, marginTop: 4 }}>This week</div>
        {upcoming.map((f) => (
          <Card key={f.id} onClick={() => open(f)} style={forYou(f) ? { borderLeft: `4px solid ${T.teal}` } : {}}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <span style={{ ...body, fontSize: 12, color: T.s500 }}>
                {f.meeting} · {f.date} · {f.time}
              </span>
              <Urgency u={f.urgency} />
            </div>
            <div style={{ ...display, fontSize: 16, fontWeight: 700, color: T.s900, lineHeight: 1.3, marginBottom: 8 }}>{f.title}</div>
            <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5, marginBottom: 8 }}>{f.body}</div>
            <div style={{ ...body, fontSize: 12, color: T.s500, marginBottom: 10 }}>📍 {f.location}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {f.tags.map((t) => (
                <Tag key={t} k={t} active={USER.topIssues.includes(t)} />
              ))}
              <span style={{ marginLeft: "auto" }}>
                <Stars value={f.rating.avg} count={f.rating.count} size={12} />
              </span>
            </div>
          </Card>
        ))}
        <div style={{ ...display, fontSize: 14, fontWeight: 700, color: T.s700, marginTop: 8 }}>What happened</div>
        {decided.map((f) => (
          <Card key={f.id} onClick={() => open(f)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ ...body, fontSize: 12, color: T.s500 }}>
                Voted {f.date} · {f.time} · {f.location.split(",")[0]}
              </span>
              <span style={{ ...body, fontSize: 12, fontWeight: 700, color: T.tealDeep }}>{f.outcome}</span>
            </div>
            <div style={{ ...display, fontSize: 15, fontWeight: 700, color: T.s900, lineHeight: 1.3 }}>{f.title}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ItemDetail({ item, back, votes, setVote, verified, onVerify }) {
  const [askVerify, setAskVerify] = useState(false);
  const [report, setReport] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const mine = votes[item.id];
  const total = item.support + item.oppose + item.unsure + (mine ? 1 : 0);
  const n = (k) => item[k] + (mine === k ? 1 : 0);
  const pct = (k) => Math.round((n(k) / total) * 100);
  const why = item.tags.filter((t) => USER.topIssues.includes(t));
  return (
    <div>
      <DarkHeader title={item.meeting} sub={item.outcome ? `Decided ${item.date}` : `${item.date} · ${item.time}`} onBack={back} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <Urgency u={item.urgency} />
            <span style={{ ...body, fontSize: 11, fontWeight: 600, background: T.indigoSoft, color: T.indigo, padding: "4px 9px", borderRadius: 999 }}>{item.area}</span>
          </div>
          <div style={{ ...display, fontSize: 22, fontWeight: 800, color: T.s900, lineHeight: 1.2, letterSpacing: -0.3 }}>{item.title}</div>
        </div>

        <Card style={{ background: item.outcome ? T.subtle : T.black, color: item.outcome ? T.s900 : "#fff" }}>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: item.outcome ? T.s500 : T.teal, marginBottom: 8 }}>
            {item.outcome ? "Discussed and voted" : "Being discussed and voted"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", gap: 10 }}><span style={{ width: 20 }}>📅</span><span style={{ ...body, fontSize: 14 }}><strong>{item.date}</strong> at {item.time}</span></div>
            <div style={{ display: "flex", gap: 10 }}><span style={{ width: 20 }}>📍</span><span style={{ ...body, fontSize: 14 }}>{item.location}<br /><span style={{ fontSize: 12, color: item.outcome ? T.s500 : T.s400 }}>{item.address}</span></span></div>
            <div style={{ display: "flex", gap: 10 }}><span style={{ width: 20 }}>🏛️</span><span style={{ ...body, fontSize: 14 }}>{item.meeting} · public comment allowed</span></div>
          </div>
          {item.outcome ? (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.s200}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ ...display, fontSize: 18, fontWeight: 800, color: T.tealDeep }}>{item.outcome}</span>
              </div>
              <div style={{ ...body, fontSize: 12, color: T.s700, marginTop: 4 }}>{item.outcomeDetail}</div>
              <div style={{ ...body, fontSize: 12, color: T.tealDeep, marginTop: 6 }}>Read the minutes · Watch the vote</div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              {["Add to calendar", "Directions", "Watch live"].map((l) => (
                <span key={l} style={{ ...body, fontSize: 12, fontWeight: 600, padding: "7px 12px", borderRadius: 999, background: "rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>{l}</span>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500 }}>How much this matters</div>
              <div style={{ ...body, fontSize: 12, color: T.s400, marginTop: 2 }}>Rated by {item.rating.count + (myRating ? 1 : 0)} neighbors</div>
            </div>
            <Stars value={item.rating.avg} size={18} />
          </div>
          <div style={{ ...body, fontSize: 12, color: T.s700, marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            Your rating: <Stars value={0} size={20} onRate={setMyRating} mine={myRating || 0} />
          </div>
        </Card>

        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>In plain English</div>
          <div style={{ ...body, fontSize: 15, color: T.s900, lineHeight: 1.55 }}>{item.body}</div>
        </Card>

        {why.length > 0 && (
          <Card style={{ background: T.tealSoft }}>
            <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.tealDeep, marginBottom: 6 }}>Why you're seeing this</div>
            <div style={{ ...body, fontSize: 14, color: T.s700, lineHeight: 1.5 }}>
              You said <strong>{why.map((t) => CATS[t].toLowerCase()).join(" and ")}</strong> matter most to you
              {item.area === USER.area ? ", and this is in your part of town." : "."}
            </div>
          </Card>
        )}

        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>Follow the money</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ ...body, fontSize: 13, color: T.s500 }}>{item.money.label}</span>
            <span style={{ ...display, fontSize: 18, fontWeight: 800, color: T.s900 }}>{item.money.value}</span>
          </div>
          <div style={{ ...body, fontSize: 13, color: T.coral, marginTop: 6 }}>{item.money.note}</div>
        </Card>

        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 10 }}>{item.outcome ? "How neighbors felt" : "Where do you stand?"}</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[
              ["support", "Support", T.teal],
              ["oppose", "Oppose", T.coral],
              ["unsure", "Unsure", T.s400],
            ].map(([k, label, c]) => (
              <button
                key={k}
                disabled={!!item.outcome}
                onClick={() => (verified ? setVote(item.id, mine === k ? null : k) : setAskVerify(true))}
                style={{
                  ...display,
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 999,
                  border: `2px solid ${mine === k ? c : T.s200}`,
                  background: mine === k ? c : "#fff",
                  color: mine === k ? (k === "unsure" ? "#fff" : T.black) : T.s700,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: item.outcome ? "default" : "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {[
            ["support", T.teal],
            ["oppose", T.coral],
            ["unsure", T.s400],
          ].map(([k, c]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ ...body, fontSize: 12, color: T.s500, width: 54, textTransform: "capitalize" }}>{k}</span>
              <div style={{ flex: 1, height: 8, background: T.subtle, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ width: `${pct(k)}%`, height: "100%", background: c, borderRadius: 999, transition: "width .3s" }} />
              </div>
              <span style={{ ...body, fontSize: 12, color: T.s700, width: 32, textAlign: "right" }}>{pct(k)}%</span>
            </div>
          ))}
          <div style={{ ...body, fontSize: 11, color: T.s400, marginTop: 6 }}>{total} neighbors · verified residents only</div>
        </Card>
        {askVerify && !verified && <VerifySheet inline onDone={() => { onVerify(); setAskVerify(false); }} onSkip={() => setAskVerify(false)} />}

        {!item.outcome && (
          <button style={{ ...display, width: "100%", padding: 16, borderRadius: 999, border: "none", background: T.black, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
            Remind me before the meeting
          </button>
        )}

        {CANDIDATE_TAKES[item.id] && (
          <Card style={{ border: `1.5px solid ${T.indigo}` }}>
            <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.indigo, marginBottom: 4 }}>Candidates on this item</div>
            <div style={{ ...body, fontSize: 11, color: T.s400, marginBottom: 10 }}>Shown, not counted. Does not affect neighbor totals, the summary, or match scores.</div>
            {CANDIDATE_TAKES[item.id].map((t) => {
              const cd = CANDIDATES.find((x) => x.id === t.cand);
              const col = t.stance === "support" ? T.teal : T.coral;
              return (
                <div key={t.cand} style={{ padding: "10px 0", borderTop: `1px solid ${T.subtle}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s900 }}>{cd.name}</span>
                    <span style={{ ...body, fontSize: 10, fontWeight: 700, color: "#fff", background: T.indigo, padding: "2px 7px", borderRadius: 999 }}>Candidate · District 1</span>
                    <span style={{ ...body, fontSize: 11, fontWeight: 700, color: col, marginLeft: "auto", textTransform: "capitalize" }}>{t.stance}s</span>
                  </div>
                  <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5 }}>{t.text}</div>
                </div>
              );
            })}
          </Card>
        )}

        <Comments target={`item-${item.id}`} gate={verified ? "You can comment: verified Port St. Lucie resident" : "Verified Port St. Lucie residents only"} priorityLabel="Lives in affected area" verified={verified} onVerify={onVerify} />
        {report && <ReportSheet subject={item.title} onClose={() => setReport(false)} />}
        <div style={{ ...body, fontSize: 12, color: T.s400, textAlign: "center", lineHeight: 1.6 }}>
          Source: {item.source}
          <br />
          <span onClick={() => setReport(true)} style={{ color: T.coral, fontWeight: 600, cursor: "pointer" }}>Report an inaccuracy</span>
        </div>
      </div>
    </div>
  );
}

function Ballot({ open }) {
  return (
    <div>
      <DarkHeader title="Your ballot" sub="Nov 3 general election · 1 race you can vote on" />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...display, fontSize: 14, fontWeight: 700, color: T.s700, marginTop: 4 }}>City Council, District 1</div>
        {CANDIDATES.map((c) => (
          <Card key={c.id} onClick={() => open(c)}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <Ring score={c.match} />
              <div style={{ flex: 1 }}>
                <div style={{ ...display, fontSize: 17, fontWeight: 700, color: T.s900 }}>{c.name}</div>
                <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.45, marginTop: 4 }}>{c.line}</div>
                <div style={{ ...body, fontSize: 11, color: T.s400, marginTop: 6 }}>{c.coverage} of 8 positions known · from public sources</div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <Stars value={c.rating.avg} count={c.rating.count} size={13} />
                  <span style={{ ...body, fontSize: 10, color: T.s400 }}>neighbor rating</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        <Card style={{ background: T.amberSoft }}>
          <div style={{ ...body, fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
            A match score only appears when we have found positions on at least 4 of 8 issues. Below that, you see what we found and nothing more.
          </div>
        </Card>
      </div>
    </div>
  );
}

function CandidateProfile({ c, back, verified, onVerify }) {
  const [openRow, setOpenRow] = useState(null);
  const [report, setReport] = useState(null);
  const [myRating, setMyRating] = useState(0);
  const userLabel = (v) => (v >= 1.5 ? "Strongly more" : v >= 0.5 ? "Lean more" : v > -0.5 ? "Neutral" : v > -1.5 ? "Lean less" : "Strongly less");
  return (
    <div>
      <DarkHeader title={c.name} sub={c.office} onBack={back} right={<Ring score={c.match} size={64} />} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...body, fontSize: 15, color: T.s900, lineHeight: 1.5 }}>{c.line}</div>
        <div style={{ ...body, fontSize: 12, color: T.s400 }}>{c.coverage} of 8 positions known · Tap any issue to see the source.</div>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500 }}>Neighbor rating</div>
              <div style={{ ...body, fontSize: 12, color: T.s400, marginTop: 2 }}>{c.rating.count + (myRating ? 1 : 0)} verified District 1 residents</div>
            </div>
            <Stars value={c.rating.avg} size={18} />
          </div>
          <div style={{ ...body, fontSize: 12, color: T.s700, marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            Your rating: <Stars value={0} size={20} onRate={setMyRating} mine={myRating || 0} />
          </div>
          <div style={{ ...body, fontSize: 11, color: T.s400, marginTop: 8 }}>Separate from your match score. The ring is about positions; this is about the person.</div>
        </Card>

        <Card style={{ padding: 6 }}>
          {Object.keys(CATS).map((k) => {
            const p = c.positions[k];
            const isOpen = openRow === k;
            const agree = p ? Math.abs(USER.dna[k] - p.score) <= 1 : null;
            return (
              <div key={k}>
                <div
                  onClick={() => p && setOpenRow(isOpen ? null : k)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 10px", borderBottom: `1px solid ${T.subtle}`, cursor: p ? "pointer" : "default" }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: p == null ? T.s200 : agree ? T.teal : T.coral, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ ...display, fontSize: 14, fontWeight: 700, color: T.s900 }}>{CATS[k]}</div>
                    <div style={{ ...body, fontSize: 12, color: T.s500, marginTop: 2 }}>
                      You: {userLabel(USER.dna[k])} · {p ? p.label : "No position found"}
                    </div>
                  </div>
                  {p && <span style={{ ...body, fontSize: 11, color: T.s400 }}>{p.src}</span>}
                </div>
                {isOpen && p && (
                  <div style={{ background: T.subtle, padding: 14, margin: "0 4px 6px", borderRadius: 14 }}>
                    <div style={{ ...body, fontSize: 14, color: T.s900, lineHeight: 1.5, fontStyle: "italic" }}>“{p.excerpt}”</div>
                    <div style={{ ...body, fontSize: 12, color: T.s500, marginTop: 8 }}>
                      {p.src} · {p.date}
                      {p.url && <span style={{ color: T.tealDeep }}> · {p.url}</span>}
                    </div>
                    <div onClick={() => setReport({ subject: `${c.name} · ${CATS[k]} · "${p.label}"`, kinds: ["The position is wrong", "The source doesn't say this", "The excerpt is out of context", "Something else"] })} style={{ ...body, fontSize: 12, color: T.coral, marginTop: 8, fontWeight: 600, cursor: "pointer" }}>Dispute this</div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>

        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>Your weighting</div>
          <div style={{ ...body, fontSize: 13, color: T.s700, lineHeight: 1.5 }}>
            Your top-issue weighting on traffic raised this by 6 points. Land lowered it by 4. <span style={{ color: T.tealDeep }}>Edit weights</span>
          </div>
        </Card>

        {report && <ReportSheet subject={report.subject} prefill={{ kinds: report.kinds }} onClose={() => setReport(null)} />}
        <div style={{ ...body, fontSize: 12, color: T.s400, textAlign: "center", lineHeight: 1.6 }}>
          Score changes are logged publicly · <span style={{ color: T.tealDeep }}>How scoring works</span>
          <br />
          <span onClick={() => setReport({ subject: c.name })} style={{ color: T.coral, fontWeight: 600, cursor: "pointer" }}>Report an inaccuracy</span>
        </div>

        <Comments target={`cand-${c.id}`} gate={verified ? "You can comment: verified resident of District 1" : "Verified District 1 residents only"} priorityLabel="Met the candidate" verified={verified} onVerify={onVerify} />
      </div>
    </div>
  );
}

function Vote() {
  return (
    <div>
      <DarkHeader title="Vote" sub="Everything you need, nothing you don't" />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>Your polling place</div>
          <div style={{ ...display, fontSize: 17, fontWeight: 700, color: T.s900 }}>Precinct 42 · Community Center</div>
          <div style={{ ...body, fontSize: 13, color: T.s700, marginTop: 4 }}>Nov 3 · 7 AM to 7 PM · 1.2 miles away</div>
        </Card>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>Early voting</div>
          <div style={{ ...body, fontSize: 14, color: T.s900 }}>Oct 24 to Nov 1 · 3 sites nearby</div>
        </Card>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>Registration</div>
          <div style={{ ...body, fontSize: 14, color: T.tealDeep, fontWeight: 600 }}>✓ Registered at your address</div>
          <div style={{ ...body, fontSize: 12, color: T.s400, marginTop: 4 }}>Checked against FL Division of Elections</div>
        </Card>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>Speak at a meeting</div>
          <div style={{ ...body, fontSize: 14, color: T.s900, lineHeight: 1.5 }}>Public comment is 3 minutes per person. Sign up at the door 15 minutes before the meeting starts.</div>
        </Card>
      </div>
    </div>
  );
}

function Profile({ top, setTop, verified, onVerify, checkedIn }) {
  const [showVerify, setShowVerify] = useState(false);
  const toggle = (k) => {
    if (top.includes(k)) setTop(top.filter((x) => x !== k));
    else if (top.length < 3) setTop([...top, k]);
  };
  return (
    <div>
      <DarkHeader title={USER.name} sub={`${USER.area} · Watchdog 🔎 · 340 points`} />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <Card style={{ background: T.black, color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ ...display, fontSize: 20, fontWeight: 800 }}>🔎 Watchdog</div>
              <div style={{ ...body, fontSize: 12, color: T.s400, marginTop: 2 }}>340 points · Good standing · 1 correction accepted</div>
            </div>
            <div style={{ ...display, fontSize: 12, color: T.teal, textAlign: "right" }}>Next: Advocate 🎤</div>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.12)", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: "57%", height: "100%", background: T.teal, borderRadius: 999 }} />
          </div>
          <div style={{ ...body, fontSize: 12, color: T.s400, lineHeight: 1.5 }}>
            340 / 600 points. To unlock Advocate: <span style={{ color: "#fff" }}>speak once at public comment</span>. Points alone won't get you there.
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 14, flexWrap: "wrap" }}>
            {LEVELS.map((l, i) => (
              <span key={l.name} title={l.gate} style={{ ...body, fontSize: 10, padding: "3px 7px", borderRadius: 999, background: i <= 4 ? T.teal : "rgba(255,255,255,0.08)", color: i <= 4 ? T.black : T.s400, fontWeight: 700 }}>
                {l.icon} {l.name}
              </span>
            ))}
          </div>
        </Card>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 8 }}>Your civic record</div>
          {[["📍 Checked in at City Hall", checkedIn ? "2" : "1"], ["🎤 Spoke at public comment", "0"], ["✓ Corrections accepted", "1"], ["✗ Corrections rejected", "0"], ["Comments removed", "0"]].map(([l, n]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.subtle}` }}>
              <span style={{ ...body, fontSize: 13, color: T.s900 }}>{l}</span>
              <span style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s900 }}>{n}</span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 4 }}>What matters most to you</div>
          <div style={{ ...body, fontSize: 13, color: T.s700, marginBottom: 12 }}>Pick up to 3. This decides what shows up first and what you get alerted about.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.keys(CATS).map((k) => {
              const on = top.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggle(k)}
                  style={{ ...display, padding: "10px 14px", borderRadius: 999, border: `2px solid ${on ? T.teal : T.s200}`, background: on ? T.teal : "#fff", color: on ? T.black : T.s700, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                >
                  {CATS[k]}
                </button>
              );
            })}
          </div>
        </Card>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 8 }}>Alerts</div>
          {["New agenda item on your issues", "Something in your neighborhood", "What happened after a vote", "30 days before an election"].map((l) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${T.subtle}` }}>
              <span style={{ ...body, fontSize: 14, color: T.s900 }}>{l}</span>
              <div style={{ width: 40, height: 22, borderRadius: 999, background: T.teal, position: "relative" }}>
                <div style={{ position: "absolute", right: 3, top: 3, width: 16, height: 16, borderRadius: 999, background: "#fff" }} />
              </div>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ ...display, fontSize: 13, fontWeight: 700, color: T.s500, marginBottom: 6 }}>Verification</div>
          <div style={{ ...body, fontSize: 14, color: T.s900 }}>{verified ? "● ● ○" : "● ○ ○"} &nbsp; {verified ? "Verified resident" : "Email only"}</div>
          <div style={{ ...body, fontSize: 12, color: T.s400, marginTop: 4 }}>{verified ? "Your votes on agenda items count toward neighborhood totals." : "Verify your address to comment and have your votes count."}</div>
          {!verified && !showVerify && <Btn label="Verify my address" onClick={() => setShowVerify(true)} />}
          {!verified && showVerify && <div style={{ marginTop: 10 }}><VerifySheet onDone={() => { onVerify(); setShowVerify(false); }} onSkip={() => setShowVerify(false)} /></div>}
        </Card>
      </div>
    </div>
  );
}


// ---------- Onboarding (5 steps) ----------
// Defined outside Onboarding so inputs keep focus between keystrokes.
function Btn({ label, onClick, ghost }) {
  return (
    <button onClick={onClick} style={{ ...display, width: "100%", padding: 16, borderRadius: 999, border: ghost ? `2px solid ${T.s200}` : "none", background: ghost ? "#fff" : T.teal, color: T.black, fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 10 }}>
      {label}
    </button>
  );
}
function ObInput({ value, set, placeholder, type = "text", err, setErr }) {
  return (
    <input value={value} onChange={(e) => { set(e.target.value); setErr(""); }} placeholder={placeholder} type={type}
      style={{ ...body, width: "100%", boxSizing: "border-box", border: `1.5px solid ${err ? T.coral : T.s200}`, borderRadius: 14, padding: "14px 16px", fontSize: 16, outline: "none", marginTop: 10 }} />
  );
}
function Onboarding({ done, top, setTop, onVerify }) {
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [zip, setZip] = useState("");
  const [street, setStreet] = useState("");
  const [err, setErr] = useState("");
  const ambiguous = zip === "34953"; // one ZIP that spans two council districts, for the demo

  const Dots = () => (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 18 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 999, background: i <= step ? T.teal : T.s200, transition: "width .2s" }} />)}
    </div>
  );
  const H = ({ children }) => <div style={{ ...display, fontSize: 26, fontWeight: 800, color: T.s900, lineHeight: 1.15, letterSpacing: -0.5 }}>{children}</div>;
  const P = ({ children }) => <div style={{ ...body, fontSize: 15, color: T.s700, lineHeight: 1.55, marginTop: 10 }}>{children}</div>;
  const Err = () => (err ? <div style={{ ...body, fontSize: 12, color: T.coral, marginTop: 6 }}>{err}</div> : null);

  const wrap = (content) => (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={{ background: T.black, padding: "56px 20px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, borderRadius: 999, background: T.teal, opacity: 0.2, filter: "blur(34px)" }} />
        <div style={{ ...display, fontSize: 14, fontWeight: 800, color: T.teal, letterSpacing: 1 }}>CIVICMARKET</div>
        <div style={{ ...body, fontSize: 12, color: T.s400, marginTop: 4 }}>Port St. Lucie beta</div>
      </div>
      <div style={{ padding: "24px 20px 32px", flex: 1 }}>
        <Dots />
        {content}
      </div>
    </div>
  );

  if (step === 0)
    return wrap(
      <>
        <H>Know what's happening in your backyard before it's decided.</H>
        <P>Every week, City Hall and the County vote on things that change your street: rezonings, rate hikes, roads, police. Most people find out after. You won't.</P>
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {["Agenda items in plain English, tagged to what you care about", "Weigh in, and see what your neighbors think", "Get told what happened after the vote"].map((t) => (
            <div key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: T.teal, fontWeight: 800 }}>✓</span>
              <span style={{ ...body, fontSize: 14, color: T.s900, lineHeight: 1.45 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28 }}>
          <Btn label="I have an invite code" onClick={() => setStep(1)} />
          <div style={{ ...body, fontSize: 12, color: T.s400, textAlign: "center", marginTop: 12 }}>Invite-only during beta. Free for residents, always. No ads.</div>
        </div>
      </>
    );

  if (step === 1)
    return wrap(
      <>
        <H>Your invite</H>
        <P>Enter the code from your invitation, then create your account.</P>
        <ObInput value={code} set={setCode} placeholder="Invite code" err={err} setErr={setErr} />
        <ObInput value={email} set={setEmail} placeholder="Email" type="email" err={err} setErr={setErr} />
        <ObInput value="" set={() => {}} placeholder="Password" type="password" err={err} setErr={setErr} />
        <Err />
        <div style={{ marginTop: 18 }}>
          <Btn label="Create account" onClick={() => { if (!code.trim()) return setErr("Enter your invite code."); if (!email.includes("@")) return setErr("Enter a valid email."); setStep(2); }} />
          <Btn label="Continue with Google" ghost onClick={() => { if (!code.trim()) return setErr("Enter your invite code first."); setStep(2); }} />
        </div>
        <div style={{ ...body, fontSize: 11, color: T.s400, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>By continuing you agree to the Terms and Privacy Policy. Your address is used only to find your districts. Never sold, never shared with campaigns.</div>
      </>
    );

  if (step === 2)
    return wrap(
      <>
        <H>Where's your backyard?</H>
        <P>Your ZIP tells us which council, county, and school board seats you can vote on. Try 34953 to see what happens when a ZIP straddles two districts.</P>
        <ObInput value={zip} set={setZip} placeholder="ZIP code" err={err} setErr={setErr} />
        {ambiguous && (
          <div style={{ marginTop: 12, background: T.amberSoft, borderRadius: 14, padding: 12 }}>
            <div style={{ ...body, fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>34953 crosses Council Districts 1 and 4. Enter your street name only, no house number, so we can tell which side you're on.</div>
            <ObInput value={street} set={setStreet} placeholder="Street name (e.g. Becker Rd)" err={err} setErr={setErr} />
          </div>
        )}
        <Err />
        <div style={{ marginTop: 18 }}>
          <Btn label="Find my districts" onClick={() => { if (!/^\d{5}$/.test(zip)) return setErr("Enter a 5-digit ZIP."); if (ambiguous && !street.trim()) return setErr("We need your street name for this ZIP."); setStep(3); }} />
        </div>
      </>
    );

  if (step === 3)
    return wrap(
      <>
        <H>This is your backyard.</H>
        <P>Here's who decides things for {street ? street : "your"} neighborhood. If this looks wrong, go back and check your ZIP.</P>
        <Card style={{ marginTop: 16, padding: 6 }}>
          {[
            ["Neighborhood", "Southwest PSL", T.teal],
            ["City Council", "District 1", T.teal],
            ["County Commission", "St. Lucie County, At-Large", "#2563EB"],
            ["School Board", "District 1", "#2563EB"],
            ["Next election", "Nov 3 · 1 race on your ballot", T.indigo],
          ].map(([k, v, c]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 10px", borderBottom: `1px solid ${T.subtle}` }}>
              <span style={{ ...body, fontSize: 13, color: T.s500 }}>{k}</span>
              <span style={{ ...display, fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
        </Card>
        <div style={{ ...body, fontSize: 13, color: T.s700, marginTop: 14, lineHeight: 1.5 }}>Coming up for you: <strong>3 agenda items this week</strong>, including a rezoning near Becker Road.</div>
        <div style={{ marginTop: 18 }}>
          <Btn label="That's me" onClick={() => setStep(4)} />
          <Btn label="Wrong ZIP, go back" ghost onClick={() => setStep(2)} />
        </div>
      </>
    );

  if (step === 4)
    return wrap(
      <>
        <VerifySheet onDone={() => { onVerify(); setStep(5); }} onSkip={() => setStep(5)} />
        <div style={{ ...body, fontSize: 12, color: T.s400, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>You can skip this and still read everything. You'll be asked again the first time you try to comment or vote.</div>
      </>
    );

  const toggle = (k) => { if (top.includes(k)) setTop(top.filter((x) => x !== k)); else if (top.length < 3) setTop([...top, k]); };
  return wrap(
    <>
      <H>What matters most to you?</H>
      <P>Pick up to three. These decide what you see first and what we alert you about. Change them anytime.</P>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
        {Object.keys(CATS).map((k) => {
          const on = top.includes(k);
          return (
            <button key={k} onClick={toggle.bind(null, k)} style={{ ...display, padding: "12px 16px", borderRadius: 999, border: `2px solid ${on ? T.teal : T.s200}`, background: on ? T.teal : "#fff", color: on ? T.black : T.s700, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              {CATS[k]}
            </button>
          );
        })}
      </div>
      <div style={{ ...body, fontSize: 12, color: T.s400, marginTop: 10 }}>{top.length} of 3 picked</div>
      <div style={{ marginTop: 18 }}>
        <Btn label={top.length ? "Show me my backyard" : "Pick at least one"} onClick={() => { if (!top.length) return; done(); }} />
      </div>
      <div style={{ ...body, fontSize: 12, color: T.s400, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>Want candidate match scores too? You can take the 8-question Civic DNA quiz from your Ballot tab whenever you're ready.</div>
    </>
  );
}

// ---------- App shell ----------
export default function CivicMarketMockup() {
  const [tab, setTab] = useState("home");
  const [item, setItem] = useState(null);
  const [cand, setCand] = useState(null);
  const [votes, setVotes] = useState({});
  const [top, setTop] = useState([]);
  const [onboarded, setOnboarded] = useState(false);
  const [verified, setVerified] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [read, setRead] = useState([]);
  const markRead = (ids) => setRead([...new Set([...read, ...ids])]);
  const unread = ALERTS.filter((a) => a.unread && !read.includes(a.id)).length;
  const onVerify = () => setVerified(true);
  USER.topIssues = top;

  const setVote = (id, v) => setVotes({ ...votes, [id]: v });

  let screen;
  if (alertsOpen && !item) screen = <Alerts back={() => setAlertsOpen(false)} open={(f) => setItem(f)} read={read} markRead={markRead} />;
  else if (item) screen = <ItemDetail item={item} back={() => setItem(null)} votes={votes} setVote={setVote} verified={verified} onVerify={onVerify} />;
  else if (cand) screen = <CandidateProfile c={cand} back={() => setCand(null)} verified={verified} onVerify={onVerify} />;
  else if (tab === "home") screen = <Home open={setItem} votes={votes} openAlerts={() => setAlertsOpen(true)} unread={unread} checkedIn={checkedIn} onCheckedIn={() => setCheckedIn(true)} />;
  else if (tab === "ballot") screen = <Ballot open={setCand} />;
  else if (tab === "vote") screen = <Vote />;
  else screen = <Profile top={top} setTop={setTop} verified={verified} onVerify={onVerify} checkedIn={checkedIn} />;

  const tabs = [
    ["home", "🏠", "Home"],
    ["ballot", "🗳️", "Ballot"],
    ["vote", "📍", "Vote"],
    ["profile", "👤", "Profile"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#E5E7EB", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: 24 }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      <div style={{ width: 390, height: 844, background: T.bgApp, borderRadius: 44, overflow: "hidden", boxShadow: "0 30px 60px rgba(13,17,23,0.25)", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ flex: 1, overflowY: "auto" }}>{onboarded ? screen : <Onboarding done={() => setOnboarded(true)} top={top} setTop={setTop} onVerify={onVerify} />}</div>
        {onboarded && <div style={{ display: "flex", background: "#fff", borderTop: `1px solid ${T.s200}`, padding: "10px 0 22px" }}>
          {tabs.map(([k, icon, label]) => {
            const on = tab === k && !item && !cand && !alertsOpen;
            return (
              <button
                key={k}
                onClick={() => {
                  setTab(k);
                  setItem(null);
                  setCand(null);
                  setAlertsOpen(false);
                }}
                style={{ ...display, flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 700, color: on ? T.tealDeep : T.s400, cursor: "pointer" }}
              >
                <span style={{ fontSize: 20 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>}
      </div>
    </div>
  );
}
