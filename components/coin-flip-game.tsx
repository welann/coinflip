"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Coins, HelpCircle, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import CoinHistory from "./coin-history"
import { toast } from "sonner"
import CatHeads from "./cat-heads"
import CatTails from "./cat-tails"
import { useWallet } from '@suiet/wallet-kit';
import { Transaction } from "@mysten/sui/transactions";
// import { useSuiClient } from '@suiet/wallet-kit';
// import { Provider } from "@mysten/sui"

type CoinSide = "heads" | "tails"
type FlipResult = { side: CoinSide; timestamp: number }

export default function CoinFlipGame() {
  const [selectedSide, setSelectedSide] = useState<CoinSide | null>(null)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipHistory, setFlipHistory] = useState<FlipResult[]>([])
  const [stats, setStats] = useState({ heads: 0, tails: 0 })
  const [score, setScore] = useState(0)
  const [showInstructions, setShowInstructions] = useState(false)
  const wallet = useWallet()
  // const {
  //   subscribeEvent,
  // } = useSuiClient();

  const getfreecoin = async () => {
    if (!wallet.connected) {
      toast("Please connect your wallet first!", {
        description: "You need to connect your wallet to get free coins.",
      })
      return
    }

    try {
      const tx = new Transaction()
      tx.moveCall({
        target: `0x59a0dfe909f6fbc4f40143d91ca8f96de8e09da3e96a167aa0e0ef9f88065dbc::coinflipcontract::claim`,
        arguments: [
          tx.object("0x3dcce94f5597604800707f7519ae91425fa8fdaa7e79dfd1b35c8185a54216b0"),
          tx.object("0xce217e687bbb40f1a4c349fc5824276fbd6caed926bd6ee27dcff74854283105")
        ],
      });

      const msg = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });

      if (msg) {
        toast("Success!", {
          description: "Free coins have been sent to your wallet.",
        })
      }
    } catch (error: unknown) {
      console.error("Transaction error:", error);

      if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('MoveAbort')) {
        toast("Already Claimed!", {
          description: "Each wallet can only claim free coins once.",
          duration: 5000,
        })
      } else {
        toast("Transaction Failed", {
          description: "Something went wrong. Please try again later.",
        })
      }
    }
  };

  const flipCoin = async () => {
    if (!wallet.connected) {
      toast("Please connect your wallet first!", {
        description: "You need to connect your wallet to play the game.",
      })
      return
    }

    if (!selectedSide) {
      toast("Please select a side first!", {
        description: "Choose heads or tails before flipping the coin.",
      })
      return
    }
    // const unsubscribe = await Provider.subscribeEvent({
    //   filter: {
    //     MoveEventType: "0x59a0dfe909f6fbc4f40143d91ca8f96de8e09da3e96a167aa0e0ef9f88065dbc::coinflipcontract::FlipResult",
    //   },
    //   onMessage: (event) => {
    //     console.log("subscribeEvent", JSON.stringify(event, null, 2))
    //   }
    // });
    try {
      // unsubscribe();
      const tx = new Transaction()

      tx.moveCall({
        target: `0x59a0dfe909f6fbc4f40143d91ca8f96de8e09da3e96a167aa0e0ef9f88065dbc::coinflipcontract::play`,
        arguments: [
          tx.object("0x3dcce94f5597604800707f7519ae91425fa8fdaa7e79dfd1b35c8185a54216b0"),
          tx.object("0x8"),
          tx.pure.u8(selectedSide === "heads" ? 0 : 1),
          tx.pure.u64(100),
        ],
      });

      const msg = await wallet.signAndExecuteTransaction({
        transaction: tx,
      });
      console.log(tx)
      if (msg) {
        toast("Success!", {
          description: "You have played the game.",
        })
      }
    } catch (error: unknown) {
      console.error("Transaction error:", error);
      toast("Transaction Failed", {
        description: "Something went wrong with your bet. Please try again.",
      })
    }
    // unsubscribe();

    // Random number of rotations between 2 and 5
    const rotations = 2 + Math.floor(Math.random() * 4)

    // Determine the result (random)
    const result: CoinSide = Math.random() > 0.5 ? "heads" : "tails"

    // After animation completes
    setTimeout(() => {
      setIsFlipping(false)

      // Update history
      const newFlip = { side: result, timestamp: Date.now() }
      setFlipHistory((prev) => [newFlip, ...prev].slice(0, 20))

      // Update stats
      setStats((prev) => ({
        ...prev,
        [result]: prev[result] + 1,
      }))

      // Update score
      if (selectedSide === result) {
        setScore((prev) => prev + 10)
        toast("You won! 🎉", {
          description: `You correctly guessed ${selectedSide === "heads" ? "heads" : "tails"} and earned 10 points!`,
        })
      } else {
        toast("You lost! 😢", {
          description: `The coin landed on ${result === "heads" ? "heads" : "tails"}, but you guessed ${selectedSide === "heads" ? "heads" : "tails"
            }.`,
        })
      }

      // Reset selection
      setSelectedSide(null)
    }, rotations * 500) // Animation time based on rotations
  }

  const totalFlips = stats.heads + stats.tails
  const headsPercentage = totalFlips > 0 ? Math.round((stats.heads / totalFlips) * 100) : 0
  const tailsPercentage = totalFlips > 0 ? Math.round((stats.tails / totalFlips) * 100) : 0

  return (
    <div className="w-full max-w-4xl">
      <Card className="border-4 border-[#0A3A5A] bg-[#F7F4E9] shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-2 border-b-2 border-[#0A3A5A]/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Coins className="h-6 w-6 text-[#F39C50]" />
              <CardTitle className="text-2xl font-bold text-[#0A3A5A]">Cat Coin Flip</CardTitle>
            </div>
            <Badge
              variant="outline"
              className="bg-[#5ECCE5]/20 text-[#0A3A5A] text-sm px-3 py-1 border-2 border-[#0A3A5A]"
            >
              Score: {score}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {/* Stats Bar */}
          <div className="flex justify-between items-center mb-4 bg-[#5ECCE5]/20 rounded-lg p-2 border-2 border-[#0A3A5A]/30">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-[#F7F4E9] text-[#0A3A5A] border-2 border-[#0A3A5A]">
                Total Flips: {totalFlips}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-[#F39C50]">Heads: {headsPercentage}%</span>
              <span className="mx-1">|</span>
              <span className="font-bold text-[#5ECCE5]">Tails: {tailsPercentage}%</span>
            </div>
          </div>

          {/* Coin History */}
          <CoinHistory history={flipHistory} />

          {/* Main Coin */}
          <div className="flex justify-center my-6 relative h-48">

          </div>

          {/* Cat Characters */}
          <div className="flex justify-between items-end mb-6">
            <div className={cn("transition-all duration-300", selectedSide === "heads" ? "scale-110" : "opacity-80")}>
              <CatHeads />
            </div>
            <div
              className="w-20 h-20 bg-[#F7F4E9] border-4 border-[#0A3A5A] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#F7F4E9]/80 hover:scale-105 transition-all duration-300 relative group"
              onClick={getfreecoin}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-4 h-4 bg-[#0A3A5A] rounded-full group-hover:animate-pulse"></div>
                <span className="text-[#0A3A5A] font-bold text-sm group-hover:text-[#F39C50]">Free Coin!</span>
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#F39C50] rounded-full animate-bounce hidden group-hover:block"></div>
            </div>
            <div className={cn("transition-all duration-300", selectedSide === "tails" ? "scale-110" : "opacity-80")}>
              <CatTails />
            </div>
          </div>

          {/* Selection Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "bg-[#F7F4E9] border-4 border-[#0A3A5A] text-[#0A3A5A] font-bold text-xl h-16 rounded-full transition-all relative overflow-hidden",
                selectedSide === "heads" && "ring-4 ring-[#F39C50] scale-105",
              )}
              onClick={() => setSelectedSide("heads")}
              disabled={isFlipping}
            >
              <div className="absolute inset-0 bg-[#F39C50]/20 rounded-full"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-[#F39C50] rounded-full flex items-center justify-center border-2 border-[#0A3A5A]">
                  H
                </div>
                Heads
              </div>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className={cn(
                "bg-[#F7F4E9] border-4 border-[#0A3A5A] text-[#0A3A5A] font-bold text-xl h-16 rounded-full transition-all relative overflow-hidden",
                selectedSide === "tails" && "ring-4 ring-[#5ECCE5] scale-105",
              )}
              onClick={() => setSelectedSide("tails")}
              disabled={isFlipping}
            >
              <div className="absolute inset-0 bg-[#5ECCE5]/20 rounded-full"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-[#5ECCE5] rounded-full flex items-center justify-center border-2 border-[#0A3A5A]">
                  T
                </div>
                Tails
              </div>
            </Button>
          </div>

          {/* Flip Button */}
          <Button
            size="lg"
            className="w-full bg-[#0A3A5A] hover:bg-[#0A3A5A]/80 text-white font-bold text-xl h-14 rounded-full border-4 border-[#0A3A5A] transition-all hover:scale-[1.02]"
            onClick={flipCoin}
            disabled={isFlipping}
          >
            {isFlipping ? "Flipping..." : "Flip Coin!"}
          </Button>

          {/* Instructions */}
          <div className="mt-4">
            <Button
              variant="ghost"
              className="text-[#0A3A5A] flex items-center gap-2"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              <HelpCircle size={16} />
              {showInstructions ? "Hide Instructions" : "How to Play"}
            </Button>

            {showInstructions && (
              <div className="mt-2 p-3 bg-[#5ECCE5]/20 rounded-lg border-2 border-[#0A3A5A]/30 text-sm text-[#0A3A5A]">
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Select heads or tails</li>
                  <li>Click the Flip Coin button</li>
                  <li>If you guess correctly, you will earn 10 points!</li>
                  <li>Try to get the highest score possible</li>
                </ol>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t-2 border-[#0A3A5A]/20 pt-4">
          <a
            href="https://x.com/viilannx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0A3A5A]/70 hover:text-[#0A3A5A] transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <div className="text-xs text-[#0A3A5A]/70">© 2025 Cat Coin Flip</div>
          <div className="flex items-center gap-4">

            <div className="flex gap-2">
              <Trophy className="h-5 w-5 text-[#F39C50]" />
              <span className="text-sm font-medium text-[#0A3A5A]">High Score: {score}</span>
            </div>
          </div>

        </CardFooter>
      </Card>
    </div>
  )
}
