import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_SOURCES = [
  { id: "1", name: "Ars Technica", url: "https://arstechnica.com", type: "blog", categories: ["general", "security", "cloud", "ai"], enabled: true },
  { id: "2", name: "The Hacker News", url: "https://thehackernews.com", type: "news", categories: ["security"], enabled: true },
  { id: "3", name: "Krebs on Security", url: "https://krebsonsecurity.com", type: "blog", categories: ["security"], enabled: true },
  { id: "4", name: "TechCrunch", url: "https://techcrunch.com", type: "news", categories: ["general", "ai", "cloud"], enabled: true },
  { id: "5", name: "The Register", url: "https://theregister.com", type: "news", categories: ["general", "cloud", "security"], enabled: true },
  { id: "6", name: "InfoQ", url: "https://infoq.com", type: "blog", categories: ["cloud", "ai"], enabled: true },
  { id: "7", name: "Darknet Diaries", url: "https://darknetdiaries.com", type: "podcast", categories: ["security"], enabled: true },
  { id: "8", name: "Changelog Podcast", url: "https://changelog.com/podcast", type: "podcast", categories: ["general", "ai", "cloud"], enabled: true },
  { id: "9", name: "TLDR Newsletter", url: "https://tldr.tech", type: "newsletter", categories: ["general", "ai", "cloud"], enabled: true },
  { id: "10", name: "MIT Technology Review", url: "https://technologyreview.com", type: "news", categories: ["ai", "general"], enabled: true },
  { id: "11", name: "Cloud Native Computing Foundation", url: "https://cncf.io/blog", type: "blog", categories: ["cloud"], enabled: true },
  { id: "12", name: "AWS Blog", url: "https://aws.amazon.com/blogs", type: "blog", categories: ["cloud"], enabled: true },
  { id: "13", name: "Google Cloud Blog", url: "https://cloud.google.com/blog", type: "blog", categories: ["cloud", "ai"], enabled: true },
  { id: "14", name: "Azure Updates", url: "https://azure.microsoft.com/en-us/updates", type: "blog", categories: ["cloud"], enabled: true },
  { id: "15", name: "Risky Business Podcast", url: "https://risky.biz", type: "podcast", categories: ["security"], enabled: true },
  { id: "16", name: "Healthcare IT News", url: "https://healthcareitnews.com", type: "news", categories: ["healthcare", "security", "ai"], enabled: true },
  { id: "17", name: "Healthcare IT Today", url: "https://healthcareittoday.com", type: "news", categories: ["healthcare", "security", "general"], enabled: true },
  { id: "18", name: "Healthcare Dive – Health IT", url: "https://healthcaredive.com/topic/health-it", type: "news", categories: ["healthcare", "security"], enabled: true },
  { id: "19", name: "HealthcareInfoSecurity", url: "https://healthcareinfosecurity.com", type: "news", categories: ["healthcare", "security"], enabled: true },
  { id: "20", name: "HIPAA Critical Podcast", url: "https://hipaacritical.com", type: "podcast", categories: ["healthcare", "security"], enabled: true },
  { id: "21", name: "HIPAA Insider Podcast", url: "https://hipaavault.com/podcast", type: "podcast", categories: ["healthcare", "security", "cloud"], enabled: true },
  { id: "22", name: "HEAL Security Dispatch", url: "https://healsecurity.com", type: "podcast", categories: ["healthcare", "security"], enabled: true },
  { id: "23", name: "The Medcurity Podcast", url: "https://medcurity.com/podcast", type: "podcast", categories: ["healthcare", "security"], enabled: true },
];

const CATEGORIES = [
  { id: "all", label: "All Topics", icon: "◉" },
  { id: "healthcare", label: "Healthcare IT", icon: "🏥" },
  { id: "security", label: "Security & Compliance", icon: "🛡" },
  { id: "cloud", label: "Cloud & Infra", icon: "☁" },
  { id: "ai", label: "AI / ML", icon: "⚡" },
  { id: "general", label: "General IT", icon: "▦" },
];

const TYPE_META = {
  news: { label: "Article", color: "#e8453c", bg: "rgba(232,69,60,0.1)" },
  blog: { label: "Blog", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  podcast: { label: "Podcast", color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  newsletter: { label: "Newsletter", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
};

const STORAGE_KEYS = { sources: "it-dash-sources", articles: "it-dash-articles", lastFetch: "it-dash-last-fetch" };

function usePersistedState(key, fallback) {
  const [val, setVal] = useState(fallback);
  const loaded = useRef(false);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(key);
        if (r?.value) setVal(JSON.parse(r.value));
      } catch {}
      loaded.current = true;
    })();
  }, [key]);
  const setPersisted = useCallback((v) => {
    setVal((prev) => {
      const next = typeof v === "function" ? v(prev) : v;
      if (loaded.current) window.storage.set(key, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [key]);
  return [val, setPersisted];
}

export default function ITNewsDashboard() {
  const [sources, setSources] = usePersistedState(STORAGE_KEYS.sources, DEFAULT_SOURCES);
  const [articles, setArticles] = usePersistedState(STORAGE_KEYS.articles, []);
  const [lastFetch, setLastFetch] = usePersistedState(STORAGE_KEYS.lastFetch, null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [view, setView] = useState("feed"); // feed | sources | detail
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [addForm, setAddForm] = useState({ name: "", url: "", type: "blog", categories: [] });
  const [showAdd, setShowAdd] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // cards | compact
  const [apiKey, setApiKey] = usePersistedState("it-dash-api-key", "");
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  // Sync input field when apiKey loads from storage
  useEffect(() => { if (apiKey) setApiKeyInput(apiKey); }, [apiKey]);

  const enabledSources = sources.filter((s) => s.enabled);
  const filteredArticles = articles
    .filter((a) => activeCategory === "all" || a.categories?.includes(activeCategory))
    .filter((a) => !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || a.summary?.toLowerCase().includes(searchQuery.toLowerCase()));

  const [error, setError] = useState(null);

  async function fetchNews() {
    if (loading) return;
    if (!apiKey) { setShowSettings(true); return; }
    setLoading(true);
    setLoadingMsg("Scanning sources...");
    setError(null);

    const sourceList = enabledSources.map((s) => `- ${s.name} (${s.url}) [${s.type}] categories: ${s.categories.join(", ")}`).join("\n");
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    try {
      setLoadingMsg("Gathering latest headlines...");
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 16000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [
            {
              role: "user",
              content: `Today is ${today}. You are an IT news curator. Search for the latest news, articles, and updates from these sources:\n\n${sourceList}\n\nFind 10-15 of the most important and recent stories from the past few days. For each, provide a title, 2-3 sentence summary, the source name, the URL, the content type (news/blog/podcast/newsletter), the relevant categories from [healthcare, security, cloud, ai, general], and a priority (high/medium/low).\n\nRespond ONLY with a JSON array, no markdown fences. Each object: {"title":"...","summary":"...","source":"...","url":"...","type":"...","categories":["..."],"priority":"...","date":"YYYY-MM-DD"}`
            }
          ],
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = errData?.error?.message || `API returned ${resp.status} ${resp.statusText}`;
        throw new Error(errMsg);
      }

      setLoadingMsg("Distilling insights...");
      const data = await resp.json();

      // Check for API-level errors in the response
      if (data.type === "error") {
        throw new Error(data.error?.message || "Unknown API error");
      }

      const textParts = data.content?.filter((b) => b.type === "text").map((b) => b.text).join("") || "";
      const cleaned = textParts.replace(/```json|```/g, "").trim();

      if (!cleaned) {
        throw new Error("No text content in API response. The model may still be processing web searches. Try again in a moment.");
      }

      let parsed = [];
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        const match = cleaned.match(/\[[\s\S]*\]/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error("Could not parse response as JSON. Raw response: " + cleaned.substring(0, 200));
        }
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const withIds = parsed.map((a, i) => ({ ...a, id: `art-${Date.now()}-${i}` }));
        setArticles(withIds);
        setLastFetch(new Date().toISOString());
      } else {
        throw new Error("API returned an empty article list. Try refreshing again.");
      }
    } catch (err) {
      console.error("Fetch failed:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  function toggleSource(id) {
    setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  function removeSource(id) {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }

  function addSource() {
    if (!addForm.name || !addForm.url) return;
    const newSource = { ...addForm, id: `src-${Date.now()}`, enabled: true, categories: addForm.categories.length ? addForm.categories : ["general"] };
    setSources((prev) => [...prev, newSource]);
    setAddForm({ name: "", url: "", type: "blog", categories: [] });
    setShowAdd(false);
  }

  function toggleAddCategory(cat) {
    setAddForm((p) => ({ ...p, categories: p.categories.includes(cat) ? p.categories.filter((c) => c !== cat) : [...p.categories, cat] }));
  }

  const timeAgo = lastFetch ? (() => {
    const mins = Math.floor((Date.now() - new Date(lastFetch).getTime()) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })() : null;

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        @keyframes scanline { 0% { top: -4px; } 100% { top: 100%; } }
      `}</style>

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}>
            <span style={S.logoIcon}>⬡</span>
            <span style={S.logoText}>SIGNAL</span>
            <span style={S.logoBadge}>IT</span>
          </div>
          <p style={S.tagline}>Your curated intelligence feed</p>
        </div>
        <div style={S.headerRight}>
          {timeAgo && <span style={S.lastUpdate}>Updated {timeAgo}</span>}
          <button style={{ ...S.btn, ...S.btnPrimary }} onClick={fetchNews} disabled={loading}>
            {loading ? "⟳ " + loadingMsg : "↻ Refresh Feed"}
          </button>
          <button style={{ ...S.btn, background: "none", color: "#888", borderColor: "#333", fontSize: 16, padding: "6px 10px" }} onClick={() => { setApiKeyInput(apiKey); setShowSettings(true); }} title="Settings">⚙</button>
        </div>
      </header>

      {/* NAV */}
      <nav style={S.nav}>
        <div style={S.navTabs}>
          <button style={{ ...S.navTab, ...(view === "feed" ? S.navTabActive : {}) }} onClick={() => setView("feed")}>
            Feed
          </button>
          <button style={{ ...S.navTab, ...(view === "sources" ? S.navTabActive : {}) }} onClick={() => setView("sources")}>
            Sources ({sources.length})
          </button>
        </div>
        {view === "feed" && (
          <div style={S.navControls}>
            <div style={S.searchBox}>
              <span style={S.searchIcon}>⌕</span>
              <input style={S.searchInput} placeholder="Filter articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && <button style={S.searchClear} onClick={() => setSearchQuery("")}>×</button>}
            </div>
            <div style={S.viewToggle}>
              <button style={{ ...S.viewBtn, ...(viewMode === "cards" ? S.viewBtnActive : {}) }} onClick={() => setViewMode("cards")} title="Card view">▦</button>
              <button style={{ ...S.viewBtn, ...(viewMode === "compact" ? S.viewBtnActive : {}) }} onClick={() => setViewMode("compact")} title="Compact view">☰</button>
            </div>
          </div>
        )}
      </nav>

      {/* CATEGORIES (feed view) */}
      {view === "feed" && (
        <div style={S.catBar}>
          {CATEGORIES.map((c) => (
            <button key={c.id} style={{ ...S.catBtn, ...(activeCategory === c.id ? S.catBtnActive : {}) }} onClick={() => setActiveCategory(c.id)}>
              <span style={S.catIcon}>{c.icon}</span> {c.label}
              {c.id !== "all" && <span style={S.catCount}>{articles.filter((a) => a.categories?.includes(c.id)).length}</span>}
            </button>
          ))}
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={S.main}>
        {view === "feed" && !selectedArticle && (
          <>
            {error && (
              <div style={S.errorBanner}>
                <div style={S.errorHeader}>
                  <span style={S.errorIcon}>⚠</span>
                  <strong>Feed refresh failed</strong>
                  <button style={S.errorClose} onClick={() => setError(null)}>×</button>
                </div>
                <p style={S.errorText}>{error}</p>
              </div>
            )}
            {articles.length === 0 && !loading && !error && (
              <div style={S.empty}>
                <div style={S.emptyIcon}>⬡</div>
                <h3 style={S.emptyTitle}>No articles yet</h3>
                <p style={S.emptyText}>Hit "Refresh Feed" to pull in the latest from your {enabledSources.length} active sources.</p>
              </div>
            )}
            {loading && articles.length === 0 && (
              <div style={S.empty}>
                <div style={{ ...S.emptyIcon, animation: "pulse 1.5s infinite" }}>⟳</div>
                <h3 style={S.emptyTitle}>{loadingMsg || "Loading..."}</h3>
                <p style={S.emptyText}>Searching {enabledSources.length} sources for the latest IT news.</p>
              </div>
            )}
            {filteredArticles.length > 0 && viewMode === "cards" && (
              <div style={S.grid}>
                {filteredArticles.map((a, i) => (
                  <article key={a.id || i} style={{ ...S.card, animationDelay: `${i * 50}ms` }} onClick={() => { setSelectedArticle(a); setView("detail"); }}>
                    <div style={S.cardTop}>
                      <span style={{ ...S.typeBadge, color: TYPE_META[a.type]?.color || "#888", background: TYPE_META[a.type]?.bg || "rgba(136,136,136,0.1)" }}>
                        {TYPE_META[a.type]?.label || a.type}
                      </span>
                      {a.priority === "high" && <span style={S.highBadge}>HIGH</span>}
                    </div>
                    <h3 style={S.cardTitle}>{a.title}</h3>
                    <p style={S.cardSummary}>{a.summary}</p>
                    <div style={S.cardFooter}>
                      <span style={S.cardSource}>{a.source}</span>
                      <span style={S.cardDate}>{a.date}</span>
                    </div>
                    <div style={S.cardCats}>
                      {a.categories?.map((c) => <span key={c} style={S.miniCat}>{c}</span>)}
                    </div>
                  </article>
                ))}
              </div>
            )}
            {filteredArticles.length > 0 && viewMode === "compact" && (
              <div style={S.compactList}>
                {filteredArticles.map((a, i) => (
                  <div key={a.id || i} style={{ ...S.compactRow, animationDelay: `${i * 30}ms` }} onClick={() => { setSelectedArticle(a); setView("detail"); }}>
                    <span style={{ ...S.typeDot, background: TYPE_META[a.type]?.color || "#888" }} />
                    {a.priority === "high" && <span style={S.highDotText}>▲</span>}
                    <span style={S.compactTitle}>{a.title}</span>
                    <span style={S.compactSource}>{a.source}</span>
                    <span style={S.compactDate}>{a.date}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* DETAIL VIEW */}
        {view === "detail" && selectedArticle && (
          <div style={S.detail}>
            <button style={S.backBtn} onClick={() => { setSelectedArticle(null); setView("feed"); }}>← Back to feed</button>
            <div style={S.detailCard}>
              <div style={S.detailMeta}>
                <span style={{ ...S.typeBadge, color: TYPE_META[selectedArticle.type]?.color, background: TYPE_META[selectedArticle.type]?.bg }}>
                  {TYPE_META[selectedArticle.type]?.label || selectedArticle.type}
                </span>
                {selectedArticle.priority === "high" && <span style={S.highBadge}>HIGH PRIORITY</span>}
                <span style={S.detailDate}>{selectedArticle.date}</span>
              </div>
              <h2 style={S.detailTitle}>{selectedArticle.title}</h2>
              <p style={S.detailSource}>Source: {selectedArticle.source}</p>
              <p style={S.detailSummary}>{selectedArticle.summary}</p>
              <div style={S.detailCats}>
                {selectedArticle.categories?.map((c) => {
                  const cat = CATEGORIES.find((ct) => ct.id === c);
                  return <span key={c} style={S.detailCatChip}>{cat?.icon} {cat?.label || c}</span>;
                })}
              </div>
              {selectedArticle.url && (
                <a href={selectedArticle.url} target="_blank" rel="noopener noreferrer" style={S.readMore}>
                  Read full article →
                </a>
              )}
            </div>
          </div>
        )}

        {/* SOURCES VIEW */}
        {view === "sources" && (
          <div style={S.sourcesView}>
            <div style={S.sourcesHeader}>
              <h2 style={S.sourcesTitle}>Manage Sources</h2>
              <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => setShowAdd(!showAdd)}>
                {showAdd ? "Cancel" : "+ Add Source"}
              </button>
            </div>

            {showAdd && (
              <div style={S.addPanel}>
                <div style={S.addRow}>
                  <input style={S.addInput} placeholder="Source name" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} />
                  <input style={S.addInput} placeholder="URL (e.g. https://example.com)" value={addForm.url} onChange={(e) => setAddForm((p) => ({ ...p, url: e.target.value }))} />
                </div>
                <div style={S.addRow}>
                  <div style={S.addTypeGroup}>
                    {Object.entries(TYPE_META).map(([k, v]) => (
                      <button key={k} style={{ ...S.addTypeBtn, ...(addForm.type === k ? { background: v.bg, color: v.color, borderColor: v.color } : {}) }} onClick={() => setAddForm((p) => ({ ...p, type: k }))}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={S.addRow}>
                  <span style={S.addLabel}>Categories:</span>
                  {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <button key={c.id} style={{ ...S.addCatBtn, ...(addForm.categories.includes(c.id) ? S.addCatBtnActive : {}) }} onClick={() => toggleAddCategory(c.id)}>
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
                <button style={{ ...S.btn, ...S.btnPrimary, marginTop: 8 }} onClick={addSource}>Add Source</button>
              </div>
            )}

            <div style={S.sourcesList}>
              {sources.map((s) => (
                <div key={s.id} style={{ ...S.sourceRow, opacity: s.enabled ? 1 : 0.45 }}>
                  <button style={S.toggleBtn} onClick={() => toggleSource(s.id)}>
                    <span style={{ ...S.toggleTrack, ...(s.enabled ? S.toggleOn : {}) }}>
                      <span style={{ ...S.toggleThumb, ...(s.enabled ? S.thumbOn : {}) }} />
                    </span>
                  </button>
                  <div style={S.sourceInfo}>
                    <span style={S.sourceName}>{s.name}</span>
                    <span style={S.sourceUrl}>{s.url}</span>
                  </div>
                  <span style={{ ...S.typeBadge, color: TYPE_META[s.type]?.color, background: TYPE_META[s.type]?.bg, fontSize: 11 }}>
                    {TYPE_META[s.type]?.label || s.type}
                  </span>
                  <div style={S.sourceCats}>
                    {s.categories?.map((c) => <span key={c} style={S.miniCat}>{c}</span>)}
                  </div>
                  {!DEFAULT_SOURCES.find((d) => d.id === s.id) && (
                    <button style={S.removeBtn} onClick={() => removeSource(s.id)} title="Remove">×</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div style={S.modalOverlay} onClick={() => setShowSettings(false)}>
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, color: "#fff", marginBottom: 6 }}>⚙ Settings</h3>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.5 }}>
              To power the news feed, this app uses the Anthropic API with web search. Enter your API key below — it's stored locally in your browser and never sent anywhere else.
            </p>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#666", marginBottom: 6, display: "block" }}>Anthropic API Key</label>
            <input
              style={{ ...S.addInput, width: "100%", flex: "none", marginBottom: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
              type="password"
              placeholder="sk-ant-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <p style={{ fontSize: 11, color: "#555", marginBottom: 20, lineHeight: 1.5 }}>
              Get your key at <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" style={{ color: "#e8453c", textDecoration: "none" }}>console.anthropic.com</a>. Web search usage is billed per query.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={{ ...S.btn, background: "none", color: "#888" }} onClick={() => setShowSettings(false)}>Cancel</button>
              <button style={{ ...S.btn, ...S.btnPrimary }} onClick={() => { setApiKey(apiKeyInput); setShowSettings(false); }}>Save Key</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={S.footer}>
        <span>{enabledSources.length} active sources</span>
        <span>·</span>
        <span>{articles.length} articles</span>
        {lastFetch && (<><span>·</span><span>Last refresh: {new Date(lastFetch).toLocaleString()}</span></>)}
      </footer>
    </div>
  );
}

const S = {
  root: { fontFamily: "'DM Sans', sans-serif", background: "#0a0a0c", color: "#e0e0e0", minHeight: "100vh", display: "flex", flexDirection: "column" },
  // Header
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 28px", borderBottom: "1px solid #1a1a22", flexWrap: "wrap", gap: 12 },
  headerLeft: {},
  headerRight: { display: "flex", alignItems: "center", gap: 14 },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 26, color: "#e8453c", fontWeight: 700 },
  logoText: { fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, letterSpacing: 4, color: "#fff" },
  logoBadge: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, background: "#e8453c", color: "#fff", padding: "2px 6px", borderRadius: 3, letterSpacing: 1 },
  tagline: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555", marginTop: 2, letterSpacing: 1 },
  lastUpdate: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555" },
  // Buttons
  btn: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, border: "1px solid #333", borderRadius: 6, padding: "8px 16px", cursor: "pointer", transition: "all .2s", letterSpacing: 0.5 },
  btnPrimary: { background: "#e8453c", color: "#fff", borderColor: "#e8453c" },
  btnDisabled: { background: "#1a1a22", color: "#666", borderColor: "#1a1a22", cursor: "wait" },
  // Nav
  nav: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 28px", borderBottom: "1px solid #1a1a22", flexWrap: "wrap", gap: 8 },
  navTabs: { display: "flex", gap: 0 },
  navTab: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, background: "none", border: "none", color: "#666", padding: "14px 20px", cursor: "pointer", borderBottom: "2px solid transparent", transition: "all .2s" },
  navTabActive: { color: "#e8453c", borderBottomColor: "#e8453c" },
  navControls: { display: "flex", alignItems: "center", gap: 10 },
  // Search
  searchBox: { position: "relative", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 10, color: "#555", fontSize: 14, pointerEvents: "none" },
  searchInput: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: "#111116", border: "1px solid #222", borderRadius: 6, padding: "7px 30px 7px 30px", color: "#ccc", width: 200, outline: "none" },
  searchClear: { position: "absolute", right: 8, background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 },
  // View toggle
  viewToggle: { display: "flex", border: "1px solid #222", borderRadius: 6, overflow: "hidden" },
  viewBtn: { background: "none", border: "none", color: "#555", padding: "6px 10px", cursor: "pointer", fontSize: 14, transition: "all .2s" },
  viewBtnActive: { background: "#1a1a22", color: "#e8453c" },
  // Category bar
  catBar: { display: "flex", gap: 6, padding: "14px 28px", overflowX: "auto", borderBottom: "1px solid #111" },
  catBtn: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 500, background: "#111116", border: "1px solid #1a1a22", borderRadius: 20, padding: "6px 14px", color: "#888", cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, transition: "all .2s" },
  catBtnActive: { background: "rgba(232,69,60,0.1)", borderColor: "#e8453c", color: "#e8453c" },
  catIcon: { fontSize: 13 },
  catCount: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "1px 6px" },
  // Main
  main: { flex: 1, padding: "20px 28px", overflowY: "auto" },
  // Empty
  empty: { textAlign: "center", padding: "80px 20px" },
  emptyIcon: { fontSize: 48, color: "#333", marginBottom: 16 },
  emptyTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: "#666", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#444", maxWidth: 360, margin: "0 auto" },
  // Card grid
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 },
  card: { background: "#111116", border: "1px solid #1a1a22", borderRadius: 10, padding: 20, cursor: "pointer", transition: "all .25s", animation: "slideUp .4s ease both", position: "relative", overflow: "hidden" },
  cardTop: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  typeBadge: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase" },
  highBadge: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: "#ff6b4a", background: "rgba(255,107,74,0.12)", padding: "3px 8px", borderRadius: 4, letterSpacing: 1 },
  cardTitle: { fontSize: 15, fontWeight: 600, color: "#eee", lineHeight: 1.4, marginBottom: 8 },
  cardSummary: { fontSize: 13, color: "#888", lineHeight: 1.55, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardSource: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555" },
  cardDate: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#444" },
  cardCats: { display: "flex", gap: 4, flexWrap: "wrap" },
  miniCat: { fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#555", background: "#0a0a0c", padding: "2px 6px", borderRadius: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  // Compact list
  compactList: { display: "flex", flexDirection: "column", gap: 2 },
  compactRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 6, cursor: "pointer", transition: "background .15s", animation: "slideUp .3s ease both" },
  typeDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  highDotText: { color: "#ff6b4a", fontSize: 10, flexShrink: 0 },
  compactTitle: { flex: 1, fontSize: 13, fontWeight: 500, color: "#ddd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  compactSource: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#555", flexShrink: 0, width: 120, textAlign: "right" },
  compactDate: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#444", flexShrink: 0, width: 80, textAlign: "right" },
  // Detail
  detail: { maxWidth: 720, margin: "0 auto" },
  backBtn: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: "none", border: "none", color: "#e8453c", cursor: "pointer", marginBottom: 20, padding: 0 },
  detailCard: { background: "#111116", border: "1px solid #1a1a22", borderRadius: 12, padding: 32 },
  detailMeta: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  detailDate: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#555" },
  detailTitle: { fontSize: 24, fontWeight: 700, color: "#fff", lineHeight: 1.3, marginBottom: 8 },
  detailSource: { fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#666", marginBottom: 20 },
  detailSummary: { fontSize: 15, color: "#aaa", lineHeight: 1.7, marginBottom: 24 },
  detailCats: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 },
  detailCatChip: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#888", background: "#0a0a0c", padding: "5px 12px", borderRadius: 6, border: "1px solid #1a1a22" },
  readMore: { fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#e8453c", textDecoration: "none", fontWeight: 600 },
  // Sources
  sourcesView: {},
  sourcesHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sourcesTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "#fff" },
  sourcesList: { display: "flex", flexDirection: "column", gap: 6 },
  sourceRow: { display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#111116", border: "1px solid #1a1a22", borderRadius: 8, transition: "opacity .2s" },
  sourceInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  sourceName: { fontSize: 14, fontWeight: 600, color: "#ddd" },
  sourceUrl: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  sourceCats: { display: "flex", gap: 4, flexWrap: "wrap" },
  // Toggle switch
  toggleBtn: { background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 },
  toggleTrack: { display: "block", width: 36, height: 20, borderRadius: 10, background: "#222", transition: "background .2s", position: "relative" },
  toggleOn: { background: "#e8453c" },
  toggleThumb: { display: "block", width: 16, height: 16, borderRadius: "50%", background: "#666", position: "absolute", top: 2, left: 2, transition: "all .2s" },
  thumbOn: { background: "#fff", left: 18 },
  removeBtn: { background: "none", border: "1px solid #333", borderRadius: 6, color: "#666", fontSize: 16, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s", flexShrink: 0 },
  // Add panel
  addPanel: { background: "#111116", border: "1px solid #1a1a22", borderRadius: 10, padding: 20, marginBottom: 20 },
  addRow: { display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap", alignItems: "center" },
  addInput: { fontFamily: "'DM Sans', sans-serif", fontSize: 13, background: "#0a0a0c", border: "1px solid #222", borderRadius: 6, padding: "8px 12px", color: "#ccc", flex: 1, minWidth: 160, outline: "none" },
  addTypeGroup: { display: "flex", gap: 6 },
  addTypeBtn: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, background: "#0a0a0c", border: "1px solid #222", borderRadius: 6, padding: "6px 12px", color: "#888", cursor: "pointer", transition: "all .2s" },
  addLabel: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#666" },
  addCatBtn: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, background: "#0a0a0c", border: "1px solid #222", borderRadius: 14, padding: "4px 10px", color: "#666", cursor: "pointer", transition: "all .2s" },
  addCatBtnActive: { borderColor: "#e8453c", color: "#e8453c", background: "rgba(232,69,60,0.08)" },
  // Footer
  footer: { fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#333", padding: "14px 28px", borderTop: "1px solid #111", display: "flex", gap: 10, justifyContent: "center" },
  // Settings modal
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modalCard: { background: "#111116", border: "1px solid #1a1a22", borderRadius: 12, padding: 32, maxWidth: 460, width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  // Error banner
  errorBanner: { background: "rgba(232,69,60,0.08)", border: "1px solid rgba(232,69,60,0.3)", borderRadius: 10, padding: "16px 20px", marginBottom: 20 },
  errorHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "#e8453c", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 },
  errorIcon: { fontSize: 16 },
  errorClose: { marginLeft: "auto", background: "none", border: "none", color: "#e8453c", cursor: "pointer", fontSize: 18, padding: 0 },
  errorText: { fontSize: 13, color: "#cc8880", lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, wordBreak: "break-word" },
};
