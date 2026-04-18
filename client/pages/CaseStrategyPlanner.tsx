import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Loader2, Download, ShieldCheck, ClipboardList } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

export default function CaseStrategyPlanner() {
  const [issue, setIssue] = useState("");
  const [strategy, setStrategy] = useState("");
  const [loading, setLoading] = useState(false);

  const generateStrategy = async () => {
    if (!issue.trim()) {
      toast.error("Please describe your legal issue first.");
      return;
    }

    setLoading(true);
    setStrategy("");

    try {
      const response = await fetch(
        "https://wutkiwsapywuxdirpngh.supabase.co/functions/v1/openrouter-chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: `
You are an Indian legal expert and strategist. 
Generate a professional, high-impact legal action plan using the following structure. 
Use markdown for formatting. Use bold headers for each section.

# LEGAL ACTION PLAN

## 1. Legal Category & Relevant Law
Identify the specific legal category and the exact Law/Sections applicable (e.g., Section 138 of NI Act).

## 2. Specific Legal Forms & Filing
Identify the EXACT form names required (e.g., "Form M" for RERA UP, "Form 1" for Consumer Court). Provide details on where to file.

## 3. Step-by-Step Action Plan
A detailed, chronological list of actions the user should take immediately.

## 4. Required Documents Checklist
List every document needed for a strong case.

## 5. Estimated Costs & Court Fees
Estimate the court fees based on the claim value and typical lawyer retainership/consultation fees in major Indian cities.

## 6. Estimated Timeline
Provide a realistic timeline for each stage of the process.

## 7. When to Contact a Lawyer
Specific triggers when professional legal help becomes mandatory.

## 8. Free Legal Aid Resources (NALSA/SLSA)
Provide information on how to access free legal aid in India if the user cannot afford a private lawyer (e.g., NALSA Helpline 15100).

## 9. Risk Level & Success Probability
(Low/Medium/High) with a brief justification.

Be extremely specific. If the user mentions a location, provide city-specific details for fees and forms.
Output the plan in clean Markdown format with bold section titles.`
              },
              {
                role: "user",
                content: `Create a detailed legal action plan for this issue:\n\n${issue}`
              }
            ]
          })
        }
      );

      const data = await response.json();
      console.log("Strategy AI Response:", data);

      if (!response.ok) {
        throw new Error(data.error || data.message || "AI Service Error");
      }

      const result = data?.answer || data?.choices?.[0]?.message?.content;

      if (typeof result === "string" && result.trim()) {
        setStrategy(result);
        toast.success("Legal strategy plan generated!");
      } else {
        throw new Error("AI returned an empty or invalid response.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate strategy. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!strategy) return;

    // Simple function to strip markdown for PDF output
    const cleanText = strategy
      .replace(/[#*]/g, "") // Remove # and *
      .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
      .trim();

    const doc = new jsPDF();
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.text("Professional Legal Action Plan", 15, 20);
    
    doc.setFont("times", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(cleanText, 180);
    doc.text(splitText, 15, 35);
    
    doc.save("Legal_Action_Plan.pdf");
    toast.success("Strategy plan downloaded!");
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-6 border border-indigo-200 dark:border-indigo-800"
        >
          <ShieldCheck className="h-4 w-4" />
          <span>Strategic Guidance</span>
        </motion.div>
        <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          Your AI-Powered <span className="text-indigo-600">Legal Roadmap.</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Get a professional action plan, timeline, and document checklist for your legal matter in minutes.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        <Card className="lg:col-span-4 shadow-2xl border-none bg-white dark:bg-gray-800 h-fit rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-indigo-600/5 pb-8 pt-10 px-10">
            <CardTitle className="text-2xl font-black text-indigo-600 tracking-tight flex items-center gap-3">
              <ClipboardList className="h-8 w-8" />
              Case Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-10">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400">Describe your legal issue</Label>
              <Textarea
                placeholder="e.g. My employer has terminated my contract without notice..."
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                className="min-h-[200px] bg-gray-50 dark:bg-gray-900 border-none rounded-2xl p-5 text-lg focus-visible:ring-indigo-500 shadow-inner"
              />
            </div>
            <Button
              onClick={generateStrategy}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-16 text-xl font-bold shadow-xl shadow-indigo-500/20 rounded-xl transition-all hover:scale-[1.02] mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Analyzing Case...
                </>
              ) : (
                "Generate Strategy"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 shadow-2xl border-none bg-white dark:bg-gray-800 flex flex-col min-h-[600px] rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-green-500/5 pb-8 pt-10 px-10 border-b border-green-500/10">
            <CardTitle className="flex items-center gap-3 text-green-600 text-2xl font-black">
              <ShieldCheck className="h-8 w-8" />
              Your Legal Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {strategy ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 bg-white dark:bg-gray-900 p-10 font-serif text-sm overflow-y-auto max-h-[650px] leading-relaxed text-gray-800 dark:text-gray-200">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="prose prose-sm dark:prose-invert max-w-none 
                      prose-h1:text-3xl prose-h1:font-black prose-h1:mb-6 prose-h1:border-b prose-h1:pb-4
                      prose-h2:text-xl prose-h2:font-black prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-indigo-600
                      prose-p:mb-4 prose-li:mb-2 prose-strong:text-indigo-700 dark:prose-strong:text-indigo-400"
                  >
                    <ReactMarkdown>{strategy}</ReactMarkdown>
                  </motion.div>
                </div>
                <div className="p-8 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    onClick={downloadPDF}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-16 text-xl font-bold rounded-xl shadow-xl shadow-green-500/20 transition-all hover:scale-[1.02]"
                  >
                    <Download className="h-6 w-6 mr-2" />
                    Download Strategy PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10 bg-gray-50/30 dark:bg-gray-900/30">
                <div className="h-24 w-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <ShieldCheck className="h-12 w-12 opacity-10" />
                </div>
                <p className="text-center px-10 text-xl font-medium max-w-sm">
                  Provide your case details to generate your personalized legal roadmap.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 p-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <h3 className="text-amber-800 dark:text-amber-400 font-bold mb-2 flex items-center gap-2">
          ⚠️ Legal Disclaimer
        </h3>
        <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
          The AI Legal Strategy Planner provides general information based on the details provided. It does not constitute formal legal advice and does not create an attorney-client relationship. Laws vary by jurisdiction and are subject to interpretation. Always consult with a qualified legal professional before taking any formal legal action.
        </p>
      </div>
    </div>
  );
}
