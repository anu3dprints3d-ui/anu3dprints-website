/** next/image-style wrapper over <img>: supports `fill`, `priority`, intrinsic width/height. */
export default function Image({ src, alt = "", fill, priority, sizes, width, height, className = "", style, loading, ...rest }) {
  if (!src) return null;
  const common = {
    src,
    alt,
    sizes,
    decoding: "async",
    loading: priority ? "eager" : (loading ?? "lazy"),
    fetchPriority: priority ? "high" : undefined,
    ...rest,
  };
  if (fill) {
    return <img {...common} className={className} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }} />;
  }
  return <img {...common} width={width} height={height} className={className} style={style} />;
}
