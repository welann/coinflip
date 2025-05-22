"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useState } from "react"

export default function ConnectWalletButton() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    // 模拟连接过程
    setTimeout(() => {
      setIsConnecting(false)
    }, 1500)
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-[#F7F4E9] hover:bg-[#F7F4E9]/90 border-4 border-[#0A3A5A] text-[#0A3A5A] font-bold rounded-full transition-all relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[#5ECCE5]/10 rounded-full"></div>
      <div className="relative z-10 flex items-center justify-center gap-2">
        <Wallet className="h-5 w-5" />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </div>
    </Button>
  )
}
