import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Scale } from "lucide-react";

const CATEGORIES = [
  "Divorce",
  "Property",
  "Criminal",
  "Business",
  "Employment",
  "Other",
];

const CONTACT_METHODS = ["Email", "Phone", "Either"];

const URGENCY_LEVELS = ["Low", "Medium", "High"];

export default function AskQuestion() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [contactMethod, setContactMethod] =
    useState<string>(CONTACT_METHODS[0]);
  const [urgency, setUrgency] = useState<string>(URGENCY_LEVELS[1]); // default Medium
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Please log in to submit a question.");
      setLoading(false);
      return;
    }

    let fileUrl: string | null = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from("question-documents")
        .upload(fileName, file);

      if (uploadError) {
        setError("File upload failed. Please try again.");
        setLoading(false);
        return;
      }

      fileUrl = data?.path ?? null;
    }

    const { error: insertError } = await supabase.from("questions").insert({
      user_id: user.id,
      title,
      description,
      category,
      contact_method: contactMethod,
      urgency, // <‑‑ new field for snapshot
      file_url: fileUrl,
    });

    if (insertError) {
      setError("Failed to submit question. Please try again.");
    } else {
      setSuccess(true);
      setTitle("");
      setDescription("");
      setCategory(CATEGORIES[0]);
      setContactMethod(CONTACT_METHODS[0]);
      setUrgency(URGENCY_LEVELS[1]);
      setFile(null);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-[#101624] dark:via-[#24243a] dark:to-[#23223a] px-4">
        <div className="p-8 bg-white rounded-xl shadow-lg max-w-md w-full text-center dark:bg-[#1a2132]">
          <Scale className="mx-auto mb-4 w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          <h2 className="mb-4 text-green-600 font-bold text-xl dark:text-green-400">
            Your question has been submitted!
          </h2>
          <p className="mb-2 text-gray-700 dark:text-gray-300">
            A legal expert will respond soon.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Submit another question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-[#101624] dark:via-[#24243a] dark:to-[#23223a] px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full border border-gray-200 dark:bg-[#1a2132] dark:border-gray-700 text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center mb-8">
          <Scale className="w-14 h-14 text-indigo-600 dark:text-indigo-400 mb-2" />
          <h2 className="text-3xl font-bold mb-1">Ask a Legal Question</h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            Please provide as much detail as possible.
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-100 text-red-700 rounded text-center font-semibold dark:bg-red-900 dark:text-red-400">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 text-gray-900 dark:text-gray-100"
        >
          <div>
            <label htmlFor="title" className="block font-semibold mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="Question title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block font-semibold mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              required
              placeholder="Describe your issue in detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="file" className="block font-semibold mb-2">
              Upload Document (optional)
            </label>
            <input
              id="file"
              type="file"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="category" className="block font-semibold mb-2">
              Category
            </label>
            <select
              id="category"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCategory(e.target.value)
              }
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="urgency" className="block font-semibold mb-2">
              Urgency
            </label>
            <select
              id="urgency"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
              value={urgency}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setUrgency(e.target.value)
              }
            >
              {URGENCY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="contactMethod"
              className="block font-semibold mb-2"
            >
              Preferred Contact Method
            </label>
            <select
              id="contactMethod"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600"
              value={contactMethod}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setContactMethod(e.target.value)
              }
            >
              {CONTACT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Question"}
          </button>
        </form>
      </div>
    </div>
  );
}
