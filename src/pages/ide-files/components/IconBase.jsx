export default function IconBase({ children, viewBox = "0 0 24 24" }) {
  return (
    <svg aria-hidden="true" viewBox={viewBox} className="h-4 w-4 fill-current">
      {children}
    </svg>
  );
}
