import { createContext, useContext, useEffect, useState } from "react";
import { publicDb } from "@/lib/supabase";
import { DEFAULT_WHATSAPP } from "@shared/whatsapp";

const DEFAULTS = {
  business: {
    name: "Anu3D Prints",
    tagline: "From Digital Design to Reality",
    support: "Small Ideas. Big Creations!",
    location: "Coimbatore, Tamil Nadu, India",
    phone: "",
    email: "",
    address: "Coimbatore, Tamil Nadu, India",
    hours: "",
    whatsapp: DEFAULT_WHATSAPP,
    currency: "INR",
    instagram: "",
    facebook: "",
    map_url: "",
    logo_key: "",
    favicon_key: "",
  },
  announcement: { enabled: false, text: "" },
  shipping: { lead_time_message: "", info: "" },
  seo: { title: "Anu3D Prints - Custom 3D Printing in Coimbatore", description: "Custom 3D printing, personalised gifts and bulk orders." },
  maintenance: { enabled: false },
};

const SettingsContext = createContext({ ...DEFAULTS, loaded: false });

export function SettingsProvider({ children }) {
  const [state, setState] = useState({ ...DEFAULTS, loaded: false });

  useEffect(() => {
    let cancelled = false;
    publicDb
      .from("site_settings")
      .select("key,value")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) return setState({ ...DEFAULTS, loaded: true });
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]));
        setState({
          business: { ...DEFAULTS.business, ...(map.business ?? {}), whatsapp: map.business?.whatsapp || DEFAULT_WHATSAPP },
          announcement: { ...DEFAULTS.announcement, ...(map.announcement ?? {}) },
          shipping: { ...DEFAULTS.shipping, ...(map.shipping ?? {}) },
          seo: { ...DEFAULTS.seo, ...(map.seo ?? {}) },
          maintenance: { ...DEFAULTS.maintenance, ...(map.maintenance ?? {}) },
          loaded: true,
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
