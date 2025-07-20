export function Logo({ size = 24 }) {
  return (
    <div className="flex">
      <div className="">
        <img
          src="/logo.svg"
          alt="logo"
        />
      </div>
      <div className="ml-2 font-bold">AOSTOCK</div>
    </div>
  );
}
