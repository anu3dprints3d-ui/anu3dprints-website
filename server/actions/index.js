import * as enquiries from "./enquiries.js";
import * as products from "./products.js";
import * as categories from "./categories.js";
import * as gallery from "./gallery.js";
import * as enquiriesAdmin from "./enquiriesAdmin.js";
import * as content from "./content.js";
import * as users from "./users.js";

/** Actions callable WITHOUT a session. Everything else requires a verified admin and then checks its own role. */
const PUBLIC = new Set(["submitEnquiry"]);

export const registry = new Map();
for (const mod of [enquiries, products, categories, gallery, enquiriesAdmin, content, users]) {
  for (const [name, fn] of Object.entries(mod)) {
    if (typeof fn === "function") registry.set(name, { fn, isPublic: PUBLIC.has(name) });
  }
}
