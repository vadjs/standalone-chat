export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 px-4 py-2">
      {/* Assistant avatar */}
      <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
        AI
      </div>

      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
