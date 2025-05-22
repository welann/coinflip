import { cn } from "@/lib/utils"

type CoinSide = "heads" | "tails"
type FlipResult = { side: CoinSide; timestamp: number }

export default function CoinHistory({ history }: { history: FlipResult[] }) {
  return (
    <div className="overflow-x-auto w-full">
      <div className="flex gap-1 py-2 min-w-max justify-between px-2">
        {history.length === 0 ? (
          <div className="flex items-center justify-center w-full h-8 text-sm text-[#0A3A5A]/70">
            No flips yet. Start playing!
          </div>
        ) : (
          history.map((flip) => (
            <div
              key={flip.timestamp}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[#0A3A5A]",
                flip.side === "heads" ? "bg-[#F39C50]/80 text-[#0A3A5A]" : "bg-[#5ECCE5]/80 text-[#0A3A5A]",
              )}
            >
              {flip.side === "heads" ? "H" : "T"}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
