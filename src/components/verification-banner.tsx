"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function VerificationBanner({ message }: { message: string }) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="w-full bg-green-900/80 text-green-100 border-b border-green-500">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <span className="text-sm">
          {message}
        </span>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="text-green-200 hover:text-white"
          aria-label="Dismiss verification message"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

