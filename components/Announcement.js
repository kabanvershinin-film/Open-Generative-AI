'use client';

export default function Announcement() {
  const text = process.env.NEXT_PUBLIC_ANNOUNCEMENT;
  
  if (!text) return null;
  
  return (
    <div className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 text-center text-sm font-medium">
      {text}
    </div>
  );
}