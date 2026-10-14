import { Link as RouterLink } from "react-router-dom";

/** next/link-style wrapper: `href` prop, external URLs become plain anchors. */
export default function Link({ href, prefetch: _prefetch, children, ...props }) {
  if (/^(https?:|mailto:|tel:)/i.test(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <RouterLink to={href} {...props}>
      {children}
    </RouterLink>
  );
}
