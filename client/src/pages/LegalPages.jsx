import { ENQUIRY_NOTICE, LegalPage } from "@/components/layout/legal-page";
import { useSettings } from "@/lib/settings";
import { useSeo } from "@/lib/seo";

const UPDATED = "October 2026";

export function PrivacyPage() {
  useSeo({ title: "Privacy Policy", path: "/privacy-policy" });
  return (
    <LegalPage
      title="Privacy Policy"
      updated={UPDATED}
      sections={[
        { heading: "Overview", body: [ENQUIRY_NOTICE] },
        { heading: "What we collect", body: ["When you submit an enquiry we store the details you provide: name, phone/WhatsApp number, optional email, message, quantities, dates and any reference files you upload."] },
        { heading: "How we use it", body: ["We use your details only to respond to your enquiry, prepare quotations and arrange production and delivery. We do not sell your data."] },
        { heading: "Storage and security", body: ["Enquiries are stored in a secured database. Uploaded customer files are kept in private storage and are accessible only to authorised staff."] },
        { heading: "WhatsApp", body: ["Choosing to continue on WhatsApp opens a chat with a pre-filled message. WhatsApp's own privacy policy applies to that conversation."] },
        { heading: "Your choices", body: ["You can ask us to correct or delete your enquiry data by contacting us using the details on the Contact page."] },
      ]}
    />
  );
}

export function TermsPage() {
  useSeo({ title: "Terms & Conditions", path: "/terms-and-conditions" });
  return (
    <LegalPage
      title="Terms & Conditions"
      updated={UPDATED}
      sections={[
        { heading: "Enquiries, not online orders", body: [ENQUIRY_NOTICE] },
        { heading: "Prices", body: ["Prices on the website are indicative. The final price is confirmed in your quotation and may vary with size, material, quantity, finishing and customisation."] },
        { heading: "Custom designs", body: ["You confirm that you have the right to have any design or file you send us printed. We may decline requests that are unlawful or infringe others' rights."] },
        { heading: "Print variations", body: ["3D printed items can show minor layer lines, colour variation and dimensional tolerance. Photos are representative."] },
        { heading: "Changes", body: ["We may update these terms and the website content at any time."] },
      ]}
    />
  );
}

export function ShippingPage() {
  useSeo({ title: "Shipping & Delivery", path: "/shipping-and-delivery" });
  const { shipping } = useSettings();
  return (
    <LegalPage
      title="Shipping & Delivery"
      updated={UPDATED}
      sections={[
        { heading: "How it works", body: [ENQUIRY_NOTICE] },
        { heading: "Delivery", body: [shipping.info || "We deliver across India. Charges and courier are confirmed with you before dispatch."] },
        { heading: "Lead time", body: [shipping.lead_time_message || "Production time depends on the item and quantity and is confirmed in your quotation."] },
        { heading: "Local pickup", body: ["Pickup in Coimbatore can be arranged once your order is ready."] },
      ]}
    />
  );
}

export function RefundPage() {
  useSeo({ title: "Cancellation & Refund Policy", path: "/cancellation-and-refund-policy" });
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      updated={UPDATED}
      sections={[
        { heading: "Arrangements are made directly", body: [ENQUIRY_NOTICE, "Cancellation, change and refund terms for a specific order are agreed with you when the order is confirmed."] },
        { heading: "Custom and personalised items", body: ["Items made to your design or personalised with your details are produced specially for you, so cancellation after production starts may not be possible. Please confirm details carefully before approving."] },
        { heading: "Damaged or incorrect items", body: ["If your item arrives damaged or not as agreed, contact us on WhatsApp with photos as soon as possible and we will work out a fix with you."] },
      ]}
    />
  );
}
