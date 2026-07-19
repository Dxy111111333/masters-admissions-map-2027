import type { SVGProps } from "react";

function IconBase({ children, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}

export function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9"/><path d="m15.4 8.6-2.1 4.7-4.7 2.1 2.1-4.7 4.7-2.1Z"/></IconBase>;
}

export function ArrowIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M5 12h14M13 6l6 6-6 6"/></IconBase>;
}

export function ExternalIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5"/></IconBase>;
}

export function SlidersIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></IconBase>;
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><path d="m5 12 4 4L19 6"/></IconBase>;
}

export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></IconBase>;
}
