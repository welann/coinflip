import Image from "next/image"

export default function CatHeads() {
  return (
    <div className="relative w-40 h-40">
      <div className="relative w-full h-full">
        <Image
          src="/head.png"
          alt="Orange cat saying Heads"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}
