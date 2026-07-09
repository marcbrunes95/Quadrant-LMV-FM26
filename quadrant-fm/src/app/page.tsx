import Link from "next/link";

const CARDS = [
  { href: "/fm", title: "FM", desc: "Prèvia · Festa Major · Frigofiesta", emoji: "🎉" },
  { href: "/gatzara", title: "Gatzara", desc: "16 i 17 de juliol", emoji: "🎪" },
];

export default function Selector() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-pink-600 p-6">
      <div className="w-full max-w-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/lamamave.png" alt="La Mama Ve" className="mx-auto mb-6 w-48" />
        <h1 className="text-white text-xl font-bold mb-6">On vols col·laborar?</h1>
        <div className="space-y-4">
          {CARDS.map((c) => (
            <Link key={c.href} href={c.href}
              className="block bg-white rounded-2xl shadow-xl p-6 text-left hover:scale-[1.02] transition">
              <span className="text-3xl" aria-hidden>{c.emoji}</span>
              <span className="block text-2xl font-extrabold mt-1" style={{ color: "#fa3c92" }}>{c.title}</span>
              <span className="block text-sm text-gray-500 mt-0.5">{c.desc}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
