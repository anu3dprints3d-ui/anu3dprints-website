-- Demo content. Everything here is editable/removable from /admin. Prices are SAMPLE values.
insert into public.categories (name, slug, description, sort_order) values
  ('Personalized Gifts', 'personalized-gifts', 'Custom-made gifts designed around your story.', 1),
  ('Keychains', 'keychains', 'Name keychains and custom shapes in your colours.', 2),
  ('Photo Lamps', 'photo-lamps', 'Lithophane photo lamps that glow with your memories.', 3),
  ('Phone Stands', 'phone-stands', 'Sturdy desk and bedside phone stands.', 4),
  ('Toys and Figurines', 'toys-and-figurines', 'Articulated toys, animals and collectible figurines.', 5),
  ('Engineering Prototypes', 'engineering-prototypes', 'Functional prototypes and fit-check parts.', 6),
  ('Corporate and Return Gifts', 'corporate-and-return-gifts', 'Branded gifts for teams, events and celebrations.', 7),
  ('Tissue Boxes and Organizers', 'tissue-boxes-and-organizers', 'Home and desk organizers.', 8),
  ('Pen Holders and Desk Accessories', 'pen-holders-and-desk-accessories', 'Desk accessories that look as good as they work.', 9),
  ('Custom 3D Printing', 'custom-3d-printing', 'Bring your own design or idea to life.', 10),
  ('Multi-Colour Prints', 'multi-colour-prints', 'Vibrant multi-colour decor and gifts.', 11),
  ('Other Products', 'other-products', 'More creations from our print farm.', 12)
on conflict (slug) do nothing;

insert into public.products (name, slug, sku, short_description, description, price, primary_category_id, material_options, color_options, lead_time, availability, is_featured, is_popular, is_published, sort_order)
select p.name, p.slug, p.sku, p.short_d, p.long_d, p.price, c.id, array['PLA'], p.colors, '3-5 days', 'made_to_order'::public.availability_status, p.feat, p.pop, true, p.ord
from (values
  ('Dancing Skeleton', 'dancing-skeleton', 'A3D-0001', 'Articulated print-in-place skeleton toy.', 'Fully articulated, printed in one piece. Sample listing - replace with your real description.', 349, 'toys-and-figurines', array['White','Glow-in-dark'], true, true, 1),
  ('Custom Name Keychain', 'custom-name-keychain', 'A3D-0002', 'Your name, your colours.', 'Personalised name keychain. Share the name and colours on WhatsApp.', 149, 'keychains', array['Pink','Blue','Yellow','Black'], true, true, 2),
  ('Photo Lamp', 'photo-lamp', 'A3D-0003', 'Lithophane lamp from your favourite photo.', 'Send a photo and we will turn it into a glowing keepsake.', 899, 'photo-lamps', array['White'], true, true, 3),
  ('Mobile Phone Stand', 'mobile-phone-stand', 'A3D-0004', 'Sturdy adjustable desk stand.', 'Fits most phones and small tablets.', 199, 'phone-stands', array['Black','White','Blue'], false, true, 4),
  ('Animal Figurine', 'animal-figurine', 'A3D-0005', 'Low-poly animal figurine.', 'Collectible low-poly cat figurine.', 399, 'toys-and-figurines', array['Blue','Pink'], true, false, 5),
  ('Tissue Box', 'tissue-box', 'A3D-0006', 'Geometric tissue box cover.', 'Modern tissue box for home and office.', 499, 'tissue-boxes-and-organizers', array['White','Black'], false, false, 6),
  ('Pen Holder', 'pen-holder', 'A3D-0007', 'Desk pen holder.', 'Compact organiser for pens and pencils.', 249, 'pen-holders-and-desk-accessories', array['Black','Yellow'], false, false, 7),
  ('Betta Fish Pencil Topper', 'betta-fish-pencil-topper', 'A3D-0008', 'Flexible betta fish pencil topper.', 'Fun flexible topper for pencils.', 99, 'other-products', array['Blue','Pink','Yellow'], false, true, 8),
  ('Multi-Colour Vase', 'multi-colour-vase', 'A3D-0009', 'Twisted multi-colour decor vase.', 'Decorative vase with a sculpted twist.', 699, 'multi-colour-prints', array['Pink','Blue'], true, false, 9),
  ('Engineering Prototype', 'engineering-prototype', 'A3D-0010', 'Functional prototype from your CAD.', 'Share your STL/STEP for a quote. Price shown is a starting point only.', 999, 'engineering-prototypes', array['As required'], false, false, 10)
) as p(name, slug, sku, short_d, long_d, price, cat, colors, feat, pop, ord)
join public.categories c on c.slug = p.cat
on conflict (slug) do nothing;

insert into public.site_settings (key, value, is_public) values
  ('business', '{"name":"Anu3D Prints","tagline":"From Digital Design to Reality","support":"Small Ideas. Big Creations!","location":"Coimbatore, Tamil Nadu, India","phone":"","email":"","address":"Coimbatore, Tamil Nadu, India","hours":"Mon-Sat, 10:00 AM - 7:00 PM","whatsapp":"918939326710","currency":"INR","instagram":"","facebook":"","map_url":"","logo_key":"","favicon_key":""}', true),
  ('announcement', '{"enabled":false,"text":""}', true),
  ('shipping', '{"lead_time_message":"Most items ship within 3-7 working days after confirmation.","info":"Delivery across India. Local pickup in Coimbatore can be arranged."}', true),
  ('seo', '{"title":"Anu3D Prints - Custom 3D Printing in Coimbatore","description":"Custom 3D printing, personalised gifts, keychains, photo lamps, prototypes and bulk orders. Enquire on WhatsApp."}', true),
  ('maintenance', '{"enabled":false}', true)
on conflict (key) do nothing;

insert into public.homepage_sections (key, title, subtitle, content, is_visible, sort_order) values
  ('hero', 'From Digital Design to Reality', 'Custom 3D Printing | Personalised Gifts | Engineering Prototypes', '{"primary_cta":"Explore Products","secondary_cta":"Get a Custom Quote"}', true, 1),
  ('trust', null, null, '{}', true, 2),
  ('categories', 'Shop by Category', null, '{}', true, 3),
  ('featured', 'Featured Products', null, '{}', true, 4),
  ('popular', 'Popular Picks', null, '{}', true, 5),
  ('recent', 'Recently Added', null, '{}', true, 6),
  ('how_it_works', 'How It Works', null, '{"steps":[{"title":"Share your idea","body":"Message us a design, photo or description."},{"title":"Get a quote","body":"We confirm material, size, timeline and price on WhatsApp."},{"title":"We print","body":"Your item is printed and finished with care."},{"title":"Delivery","body":"Pickup in Coimbatore or delivery across India."}]}', true, 7),
  ('custom_print', 'Custom 3D Printing', 'Have an STL or just an idea? Tell us about it.', '{}', true, 8),
  ('bulk', 'Bulk Orders and Corporate Gifts', 'Branded gifts, return gifts and event merchandise.', '{}', true, 9),
  ('gallery', 'From Our Print Farm', null, '{}', true, 10),
  ('faq', 'Frequently Asked Questions', null, '{}', true, 11),
  ('contact', 'Talk to Us on WhatsApp', null, '{}', true, 12)
on conflict (key) do nothing;

insert into public.faqs (question, answer, sort_order) values
  ('How do I place an order?', 'This website takes enquiries only. Tap "Enquire on WhatsApp" on any product and we will confirm details, price and timeline with you directly. No payment is taken on the website.', 1),
  ('Can you print my own design?', 'Yes. Use the Custom 3D Printing page to share your file or idea and we will send a quotation.', 2),
  ('Do you deliver across India?', 'Yes. Delivery arrangements and charges are confirmed with you on WhatsApp.', 3),
  ('Do you take bulk orders?', 'Yes - corporate gifts, return gifts and event merchandise. Use the Bulk Orders page for a quotation.', 4);
