import { Loader2 } from "lucide-react";

export default function GenerateLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#135bec] animate-spin" />
      <p className="mt-4 text-lg text-slate-600 font-medium">Loading Quiz Creator...</p>
    </div>
  );
}
