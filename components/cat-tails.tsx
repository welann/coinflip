import Image from "next/image"

export default function CatTails() {
  return (
    <div className="relative w-40 h-40">
      <div className="relative w-full h-full">
        <Image
          src="/tail.png"
          alt="Blue cat saying Tails"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
