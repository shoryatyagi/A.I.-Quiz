import { Loader2 } from "lucide-react";

export default function HistoryLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#7438dc] animate-spin" />
      <p className="mt-4 text-lg text-slate-600 font-medium">Loading History...</p>
    </div>
  );
}
