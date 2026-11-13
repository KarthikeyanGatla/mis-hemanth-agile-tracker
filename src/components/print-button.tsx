"use client";

export function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn print:hidden">
      Save as PDF
    </button>
  );
}
