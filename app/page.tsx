import ConnectWalletButton from "@/components/connect-wallet-button"
import CoinFlipGame from "@/components/coin-flip-game"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cat Coin Flip Game",
  description: "A cute cat-themed coin flip game where you can test your luck by choosing heads or tails!",
}

export default function Home() {
  return (
    <main className="min-h-screen bg-[#5ECCE5] flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-10">
        <ConnectWalletButton />
      </div>

      <CoinFlipGame />
    </main>
  )
}

