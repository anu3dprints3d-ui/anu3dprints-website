import { useEffect } from "react";

function setMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

/** Sets the document title and key meta tags for client-side navigation. (First loads get the same tags from the server.) */
export function useSeo({ title, description, image, path }) {
  useEffect(() => {
    if (title) document.title = title.includes("Anu3D") ? title : `${title} | Anu3D Prints`;
    if (description) {
      setMeta('meta[name="description"]', { name: "description", content: description });
      setMeta('meta[property="og:description"]', { property: "og:description", content: description });
    }
    if (title) setMeta('meta[property="og:title"]', { property: "og:title", content: document.title });
    if (image) setMeta('meta[property="og:image"]', { property: "og:image", content: image });
    setMeta('link[rel="canonical"]', { rel: "canonical", href: `${window.location.origin}${path ?? window.location.pathname}` });
  }, [title, description, image, path]);
}
