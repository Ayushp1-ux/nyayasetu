import { useEffect, useState } from "react";

type CaseTag =
  | "Criminal"
  | "Civil"
  | "Constitutional"
  | "Corporate"
  | "International"
  | "Other";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  link?: string;
  tag?: CaseTag;
}

export default function CourtNews() {
  const [allNews, setAllNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState<
    "all" | "Criminal" | "Civil" | "Constitutional" | "Corporate" | "International"
  >("all");
  const [summaryItem, setSummaryItem] = useState<NewsItem | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchNews();
    const saved = localStorage.getItem("savedNews");
    if (saved) {
      const savedNews = JSON.parse(saved);
      setSavedIds(new Set(savedNews.map((item: NewsItem) => item.id)));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchNews, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  function inferTag(item: { title: string; content: string }): CaseTag {
    const text = (item.title + " " + (item.content || "")).toLowerCase();

    if (
      text.match(
        /murder|assault|robbery|theft|bail|custody|fir|charge[\s-]?sheet|police|narcotics|ndps|ipc|terror|uapa/
      )
    ) {
      return "Criminal";
    }
    if (
      text.match(
        /article 14|article 19|article 21|fundamental right|constitutional bench|basic structure|reservation|quota|aadhaar/
      )
    ) {
      return "Constitutional";
    }
    if (
      text.match(
        /contract|property dispute|land dispute|maintenance|alimony|divorce|family court|injunction|damages|negligence|tenant|landlord/
      )
    ) {
      return "Civil";
    }
    if (
      text.match(
        /insolvency|bankruptcy|nclt|nclat|sebi|merger|acquisition|gst|income tax|it department|corporate|company law|competition commission|cci/
      )
    ) {
      return "Corporate";
    }
    if (
      text.match(
        /european court of human rights|icc|icj|international criminal court|extradition|un tribunal|world court/
      )
    ) {
      return "International";
    }
    return "Other";
  }

  async function fetchNews() {
    try {
      setLoading(true);
      setError(null);

      const apiKey = "afd017fb400f4bec9e317a0ec7f928d8";

      // 1) India‑focused legal news
      const indiaUrl = new URL("https://newsapi.org/v2/everything");
      indiaUrl.searchParams.set(
        "q",
        "(India OR Indian OR \"Supreme Court of India\" OR \"SC bench\" OR \"High Court\" OR PIL OR Delhi OR Mumbai OR Bengaluru OR Kolkata OR Chennai) " +
          "AND (court OR judge OR judiciary OR legal OR verdict OR judgement OR petition OR trial OR case OR FIR OR chargesheet OR bail OR arrest)"
      );
      indiaUrl.searchParams.set("language", "en");
      indiaUrl.searchParams.set("sortBy", "publishedAt");
      indiaUrl.searchParams.set("pageSize", "40");
      indiaUrl.searchParams.set("apiKey", apiKey);

      // 2) Global legal / courts news
      const globalUrl = new URL("https://newsapi.org/v2/everything");
      globalUrl.searchParams.set(
        "q",
        "(\"supreme court\" OR \"high court\" OR constitutional court OR judiciary OR lawsuit OR litigation OR indictment OR verdict OR ruling OR judgement) " +
          "AND (law OR legal OR court)"
      );
      globalUrl.searchParams.set("language", "en");
      globalUrl.searchParams.set("sortBy", "publishedAt");
      globalUrl.searchParams.set("pageSize", "40");
      globalUrl.searchParams.set("apiKey", apiKey);

      const [indiaResp, globalResp] = await Promise.all([
        fetch(indiaUrl.toString()),
        fetch(globalUrl.toString()),
      ]);

      if (!indiaResp.ok) throw new Error(`India HTTP ${indiaResp.status}`);
      if (!globalResp.ok) throw new Error(`Global HTTP ${globalResp.status}`);

      const indiaJson = await indiaResp.json();
      const globalJson = await globalResp.json();

      const mapArticles = (articles: any[]): NewsItem[] =>
        (articles || []).map((a: any, idx: number) => {
          const title = a.title ?? "No title";
          const content = a.description ?? a.content ?? "";
          return {
            id:
              a.url ||
              String(idx) + Math.random().toString(36).slice(2), // avoid collisions
            title,
            content,
            date: a.publishedAt ?? new Date().toISOString(),
            link: a.url ?? "",
            tag: inferTag({ title, content }),
          };
        });

      const indiaNews = mapArticles(indiaJson.articles || []);
      const globalNews = mapArticles(globalJson.articles || []);

      // India first, then global, de‑duplicate by id
      const combinedMap = new Map<string, NewsItem>();
      for (const item of [...indiaNews, ...globalNews]) {
        if (!combinedMap.has(item.id)) {
          combinedMap.set(item.id, item);
        }
      }
      const combinedNews = Array.from(combinedMap.values());

      setAllNews(combinedNews);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to load live court news. Please try again later.");
    } finally {
      setLoading(false);
    }
  }
  async function handleSummary(item: NewsItem) {
    setSummaryItem(item);
    setAiSummary(null);
    setSummaryLoading(true);
  
    try {
      const res = await fetch(
        "https://wutkiwsapywuxdirpngh.supabase.co/functions/v1/openrouter-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "summary",
            content: item.title + "\n\n" + item.content,
          }),
        }
      );
  
      const data = await res.json();
      setAiSummary(data.answer);
    } catch (err) {
      console.error(err);
      setAiSummary("Failed to generate summary.");
    }
  
    setSummaryLoading(false);
  }

  // Recompute filteredNews whenever data / search / tagFilter changes
  useEffect(() => {
    let data = [...allNews];

    // Tag filter
    if (tagFilter !== "all") {
      data = data.filter((item) => item.tag === tagFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content?.toLowerCase().includes(q)
      );
    }

    setFilteredNews(data);
    setCurrentPage(1);
  }, [allNews, searchQuery, tagFilter]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleSave = (item: NewsItem) => {
    const saved = localStorage.getItem("savedNews");
    let savedNews: NewsItem[] = saved ? JSON.parse(saved) : [];

    if (savedIds.has(item.id)) {
      savedNews = savedNews.filter((n) => n.id !== item.id);
      setSavedIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    } else {
      savedNews.push(item);
      setSavedIds((prev) => new Set(prev).add(item.id));
    }

    localStorage.setItem("savedNews", JSON.stringify(savedNews));
  };

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedNews = filteredNews.slice(startIdx, startIdx + itemsPerPage);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600 dark:text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading latest court news...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
        <p className="text-red-700 dark:text-red-400 font-semibold">
          ⚠️ {error}
        </p>
        <button
          onClick={fetchNews}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (allNews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          📰 No court news available at the moment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
        Latest Court News
      </h2>

      {/* Tag filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: "all", label: "All types" },
          { key: "Criminal", label: "Criminal" },
          { key: "Civil", label: "Civil" },
          { key: "Constitutional", label: "Constitutional" },
          { key: "Corporate", label: "Corporate/Tax" },
          { key: "International", label: "International" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setTagFilter(opt.key as any)}
            className={`px-3 py-1 rounded-full text-xs border ${
              tagFilter === opt.key
                ? "bg-primary text-white border-primary"
                : "bg-transparent text-gray-600 dark:text-gray-300 border-gray-400"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search court news..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-sm text-gray-500 mt-2">
          Showing {paginatedNews.length} of {filteredNews.length} results •{" "}
          {savedIds.size} saved
        </p>
      </div>

      {/* News List */}
      <ul className="space-y-6">
        {paginatedNews.map((item) => (
          <li
            key={item.id}
            className="border-l-4 border-primary bg-white dark:bg-gray-800 p-6 rounded-r-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  {item.tag && item.tag !== "Other" && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                      {item.tag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  📅{" "}
                  {new Date(item.date).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
                  {item.content}
                </p>
                <div className="flex gap-3 mt-2">
                  {item.link && (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary-dark font-medium text-sm"
                    >
                      Read full article →
                    </a>
                  )}
                  <button
                    onClick={() => handleSummary(item)}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    View legal summary
                  </button>
                </div>
              </div>
              <button
                onClick={() => toggleSave(item)}
                className={`text-2xl hover:scale-110 transition-transform ${
                  savedIds.has(item.id) ? "text-yellow-500" : "text-gray-400"
                }`}
                title={
                  savedIds.has(item.id) ? "Remove from saved" : "Save article"
                }
              >
                ★
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark"
          >
            ← Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-2 rounded ${
                  currentPage === i + 1
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-dark"
          >
            Next →
          </button>
        </div>
      )}

      {/* Refresh Info */}
      <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
        <p>🔄 News updates every 10 minutes</p>
        <button
          onClick={fetchNews}
          className="mt-2 text-primary hover:underline font-medium"
        >
          Refresh now
        </button>
      </div>

      {/* Legal summary modal */}
      {summaryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 max-w-xl w-full mx-4 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Legal summary
              </h3>
              <button
                onClick={() => setSummaryItem(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Based on: {summaryItem.title}
            </p>

            {summaryLoading && (
      <p className="text-sm text-gray-600 dark:text-gray-300">
    Generating AI summary...
  </p>
)}

            {aiSummary && (
              <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">
                {aiSummary}
              </div>
            )}

            {summaryItem.link && (
              <a
                href={summaryItem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:text-primary-dark font-medium text-sm mt-4"
              >
                Open full article →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
