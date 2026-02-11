import imgDuck1 from "figma:asset/cdd77e77d78a316a3009aac4110f02d63e0a36e1.png";

export default function IPhone1415Pro() {
  return (
    <div className="bg-black relative size-full" data-name="iPhone 14 & 15 Pro - 1">
      <div className="absolute flex items-center justify-center left-[-216px] size-[935px] top-[-2px]">
        <div className="flex-none rotate-[180deg] scale-y-[-100%]">
          <div className="relative size-[935px]" data-name="duck 1">
            <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
              <img alt="" className="absolute max-w-none object-50%-50% object-cover size-full" src={imgDuck1} />
              <div className="absolute bg-gradient-to-b from-[rgba(0,0,0,0)] inset-0 to-[rgba(0,0,0,0.65)]" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute font-['Inter:Medium',sans-serif] font-medium leading-[0.71] left-[15px] not-italic text-[96px] text-nowrap text-white top-[73px] tracking-[-14.4px] whitespace-pre">
        <p className="mb-0">MAKERS</p>
        <p>LENS</p>
      </div>
      <p className="absolute font-['Inter:Extra_Light',sans-serif] font-extralight leading-[0.71] left-[15px] not-italic text-[96px] text-nowrap text-white top-[713px] tracking-[-14.4px] whitespace-pre">SWIPE UP!</p>
    </div>
  );
}