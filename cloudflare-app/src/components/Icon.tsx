// Exact Tabler outline paths used in the approved Paper design (MIT).
const paths = {
  sun: ['M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0', 'M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7'],
  moon: ['M12 3c.132 0 .263 0 .393 .008a9 9 0 0 0 9.599 9.599a9 9 0 1 1 -9.992 -9.607z'],
  down: ['M6 9l6 6l6 -6'],
  close: ['M18 6l-12 12', 'M6 6l12 12'],
  info: ['M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0', 'M12 9h.01', 'M11 12h1v4h1'],
}
export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths[name].map(path => <path key={path} d={path} />)}
  </svg>
}
