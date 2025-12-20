import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Utility function to check if a string is a valid URL
function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export default function CaseSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setCases([]);
      return;
    }
    setLoading(true);
    async function fetchCases() {
      // Use ilike for basic keyword search in title or summary
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .ilike("title", `%${searchTerm}%`);
      // Optionally expand: .or(`summary.ilike.%${searchTerm}%`)
      setCases(data ?? []);
      setLoading(false);
    }
    fetchCases();
  }, [searchTerm]);

  return (
    <main className="py-16 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Search Court Cases</h1>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by case name, keyword..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 mb-8"
        />
        {loading && <div className="text-gray-500 mb-4">Searching...</div>}
        <ul>
          {cases.length === 0 && searchTerm && !loading && (
            <li className="text-gray-600">No cases found.</li>
          )}
          {cases.map((caseItem) => (
            <li key={caseItem.id} className="mb-8 p-4 rounded-lg bg-white dark:bg-gray-800 shadow">
              <h2 className="text-xl font-bold mb-2">
                {caseItem.title} ({caseItem.year})
              </h2>
              <p className="mb-2 text-primary">{caseItem.court}</p>
              <p className="text-gray-700 dark:text-gray-200">{caseItem.summary}</p>
              {caseItem.full_text && (
                isValidUrl(caseItem.full_text) ? (
                  <a
                    href={caseItem.full_text}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary mt-2 inline-block hover:underline"
                  >
                    Full Judgment
                  </a>
                ) : (
                  <details className="mt-2">
                    <summary className="text-primary cursor-pointer">Full Judgment (expand)</summary>
                    <div className="mt-2 whitespace-pre-line text-gray-700 dark:text-gray-200">
                      {caseItem.full_text}
                    </div>
                  </details>
                )
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
