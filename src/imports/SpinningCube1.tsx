export default function SpinningCube() {
  return (
    <div className="relative size-full" data-name="spinning cube 1">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" />
        <div className="absolute bg-[#00ff99] inset-0 mix-blend-multiply" />
      </div>
    </div>
  );
}