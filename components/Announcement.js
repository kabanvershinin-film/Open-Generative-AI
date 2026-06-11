'use client';

export default function Announcement() {
  const text = process.env.NEXT_PUBLIC_ANNOUNCEMENT;
  
  if (!text) return null;
  
  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-3 px-4 text-center text-sm font-medium shadow-md">
      <span className="mr-2">⚠️</span>
      {text}
    </div>
  );
}