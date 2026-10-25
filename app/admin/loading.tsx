import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-gray-500">
      <Loader2 size={18} className="mr-2 animate-spin text-sky-600" />
      Memuat...
    </div>
  );
}
