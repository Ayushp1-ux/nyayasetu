import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, FileText, ExternalLink, X, Scale, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

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
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔥 NEW STATES FOR AI SUMMARY
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setCases([]);
      return;
    }
    setLoading(true);
    async function fetchCases() {
      const { data } = await supabase
        .from("cases")
        .select("*")
        .ilike("title", `%${searchTerm}%`);

      setCases(data ?? []);
      setLoading(false);
    }
    fetchCases();
  }, [searchTerm]);

  // 🔥 AI SUMMARY FUNCTION
  async function generateAiSummary(caseItem: any) {
    try {
      setSelectedCase(caseItem);
      setLoadingSummary(true);
      setAiSummary(null);

      const response = await fetch(
        "https://wutkiwsapywuxdirpngh.supabase.co/functions/v1/openrouter-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are a legal assistant. Provide a structured legal summary with headings, bullet points, key principles, and why the case matters."
              },
              {
                role: "user",
                content: `
Summarize this Indian court case clearly:

Title: ${caseItem.title}
Year: ${caseItem.year}
Court: ${caseItem.court}

Full Text:
${caseItem.full_text}
                `
              }
            ]
          })
        }
      );

      const data = await response.json();
      const content =
        data?.answer || data?.content || data?.choices?.[0]?.message?.content || "No summary available.";

      setAiSummary(content);
    } catch (err) {
      console.error("AI summary error:", err);
      setAiSummary("Failed to generate summary. Please check your connection.");
    } finally {
      setLoadingSummary(false);
    }
  }

  return (
    <main className="py-12 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            Search Court Cases
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Search thousands of Indian legal judgments and get instant AI-powered summaries.
          </p>
        </div>

        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by case name, keyword (e.g. Kesavananda Bharati)..."
            className="pl-12 py-8 text-xl shadow-2xl bg-white dark:bg-gray-800 border-none rounded-2xl focus-visible:ring-primary transition-all placeholder:text-gray-400"
          />
        </div>

        {loading && (
          <div className="flex justify-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <div className="space-y-6">
          {cases.length === 0 && searchTerm && !loading && (
            <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              No cases found for "{searchTerm}"
            </div>
          )}

          {cases.map((caseItem, idx) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-800 rounded-3xl group">
                <CardHeader className="pb-4 pt-8 px-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Scale className="h-3 w-3" />
                        {caseItem.court}
                      </div>
                      <CardTitle className="text-2xl font-black text-gray-900 dark:text-white leading-tight group-hover:text-primary transition-colors">
                        {caseItem.title}
                      </CardTitle>
                      <CardDescription className="text-gray-500 font-medium mt-1">
                        Judgment Year: {caseItem.year}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <p className="text-gray-600 dark:text-gray-400 mb-8 line-clamp-3 leading-relaxed">
                    {caseItem.summary}
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={() => generateAiSummary(caseItem)}
                      className="bg-primary hover:bg-primary/90 text-white px-6 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Legal Summary
                    </Button>

                    {caseItem.full_text && (
                      isValidUrl(caseItem.full_text) ? (
                        <Button variant="outline" asChild className="rounded-xl border-gray-200 dark:border-gray-700 px-6">
                          <a
                            href={caseItem.full_text}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Full Judgment
                          </a>
                        </Button>
                      ) : (
                        <details className="w-full mt-4">
                          <summary className="text-sm font-bold text-primary cursor-pointer hover:underline mb-2 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Read Full Text
                          </summary>
                          <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-2xl whitespace-pre-line text-sm text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800 max-h-96 overflow-y-auto leading-relaxed shadow-inner">
                            {caseItem.full_text}
                          </div>
                        </details>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🔥 AI SUMMARY MODAL */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <Card className="max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border-none">
            <CardHeader className="border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  AI Legal Summary
                </CardTitle>
                <CardDescription className="truncate max-w-[400px]">
                  {selectedCase.title}
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setSelectedCase(null);
                  setAiSummary(null);
                }}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-8 bg-white dark:bg-gray-900">
              {loadingSummary ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-gray-500 font-medium">Analyzing judgment text...</p>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none
                    prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4
                    prose-h2:text-lg prose-h2:font-bold prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-primary
                    prose-p:mb-4 prose-li:mb-2 prose-strong:text-primary dark:prose-strong:text-primary
                    font-sans text-gray-800 dark:text-gray-200">
                  <ReactMarkdown>
                    {aiSummary || ""}
                  </ReactMarkdown>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}