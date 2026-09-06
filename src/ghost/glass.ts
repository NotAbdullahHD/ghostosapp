/** Shared frosted-glass surface used by the dock, top panels and desktop widgets. */
export const GLASS: React.CSSProperties = {
  background: "rgba(255,255,255,0.09)",
  backdropFilter: "blur(30px) saturate(170%)",
  WebkitBackdropFilter: "blur(30px) saturate(170%)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow:
    "0 18px 48px -26px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.28), inset 0 -1px 0 rgba(255,255,255,.06)",
};
