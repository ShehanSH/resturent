-- =============================================================================
-- Development seed data (safe for the Supabase SQL Editor)
--
-- Descriptions use dollar-quoting ($s$...$s$) so words like "into" are never
-- parsed as SQL. Re-running this file is safe: conflicts are ignored.
-- =============================================================================

update public.restaurant_settings
set restaurant_name = 'Hot Bread Beruwala',
    tagline = 'Freshly prepared with the finest ingredients',
    description = $s$A neighbourhood kitchen in Beruwala serving kottu, rice and curry, charcoal-grilled burgers and stone-baked pizza. Everything is prepared fresh once you order, for pickup or delivery.$s$,
    seo_title = 'Hot Bread Beruwala | Order Online',
    seo_description = $s$Order kottu, rice and curry, burgers and pizza online from Hot Bread Beruwala. Pickup or delivery.$s$,
    address = '157/ EF Galle Rd, Beruwala',
    order_prefix = 'HBB';

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------

insert into public.categories (name, slug, description, display_order, is_active, is_featured)
values
  ('Kottu', 'kottu', $s$Chopped godhamba roti stir-fried on the hotplate with egg, vegetables and your choice of meat.$s$, 1, true, true),
  ('Rice & Curry', 'rice-and-curry', $s$Steamed rice with a rotating selection of home-style curries, sambol and papadam.$s$, 2, true, true),
  ('Burgers', 'burgers', $s$Charcoal-grilled patties in a toasted brioche bun, served with fries.$s$, 3, true, true),
  ('Pizza', 'pizza', $s$Hand-stretched dough, San Marzano tomato base, stone baked to order.$s$, 4, true, false),
  ('Submarines', 'submarines', $s$Foot-long toasted subs packed with grilled fillings and house sauces.$s$, 5, true, false),
  ('Beverages', 'beverages', $s$Fresh juices, iced coffee and chilled soft drinks.$s$, 6, true, false),
  ('Desserts', 'desserts', $s$Watalappan, chocolate biscuit pudding and other sweet finishes.$s$, 7, true, false)
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Option groups and options
-- -----------------------------------------------------------------------------

insert into public.option_groups
  (name, description, selection_type, is_required, min_select, max_select, display_order)
values
  ('Portion size', 'Choose how hungry you are', 'SINGLE', true, 1, 1, 1),
  ('Spice level', 'Choose the heat level', 'SINGLE', true, 1, 1, 2),
  ('Extra toppings', 'Add as many as you like', 'MULTIPLE', false, 0, 6, 3),
  ('Pizza size', 'Choose your pizza size', 'SINGLE', true, 1, 1, 1),
  ('Drink size', 'Choose your cup size', 'SINGLE', true, 1, 1, 1)
on conflict do nothing;

insert into public.options (option_group_id, name, price_adjustment, display_order, is_default)
select g.id, v.name, v.price_adjustment, v.display_order, v.is_default
from public.option_groups g
join (values
  ('Portion size', 'Regular', 0.00, 1, true),
  ('Portion size', 'Large', 350.00, 2, false),
  ('Portion size', 'Family (serves 3)', 850.00, 3, false),
  ('Spice level', 'Mild', 0.00, 1, true),
  ('Spice level', 'Medium', 0.00, 2, false),
  ('Spice level', 'Sri Lankan hot', 0.00, 3, false),
  ('Extra toppings', 'Extra cheese', 200.00, 1, false),
  ('Extra toppings', 'Fried egg', 150.00, 2, false),
  ('Extra toppings', 'Extra chicken', 400.00, 3, false),
  ('Extra toppings', 'Crispy bacon', 450.00, 4, false),
  ('Extra toppings', 'Grilled mushrooms', 180.00, 5, false),
  ('Extra toppings', 'Jalapenos', 120.00, 6, false),
  ('Pizza size', 'Personal 7 inch', 0.00, 1, true),
  ('Pizza size', 'Medium 10 inch', 700.00, 2, false),
  ('Pizza size', 'Large 13 inch', 1400.00, 3, false),
  ('Drink size', 'Regular', 0.00, 1, true),
  ('Drink size', 'Large', 150.00, 2, false)
) as v(group_name, name, price_adjustment, display_order, is_default)
  on v.group_name = g.name
on conflict (option_group_id, name) do nothing;

-- -----------------------------------------------------------------------------
-- Food items (one insert per dish so a description cannot be parsed as SQL)
-- -----------------------------------------------------------------------------

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Chicken Kottu', 'chicken-kottu',
  $s$Our best seller, chopped on the hotplate$s$,
  $s$Godhamba roti chopped with shredded chicken, leeks, carrot, egg and our house curry sauce. Served with a side of gravy.$s$,
  1450.00, null, 18, 1, true
from public.categories where slug = 'kottu'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Cheese Kottu', 'cheese-kottu',
  $s$Loaded with melted cheese$s$,
  $s$A rich take on the classic: chicken kottu folded through with a generous handful of melting cheese.$s$,
  1750.00, 1550.00, 20, 2, true
from public.categories where slug = 'kottu'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Vegetable Kottu', 'vegetable-kottu',
  $s$Fully vegetarian$s$,
  $s$Roti chopped with leeks, carrot, cabbage, green chilli and egg. Ask for it without egg to make it vegan.$s$,
  1150.00, null, 15, 3, false
from public.categories where slug = 'kottu'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Chicken Rice & Curry', 'chicken-rice-and-curry',
  $s$Five curries and a chicken portion$s$,
  $s$Steamed samba rice with chicken curry, dhal, a seasonal vegetable, coconut sambol and papadam.$s$,
  1250.00, null, 12, 1, true
from public.categories where slug = 'rice-and-curry'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Fish Ambul Thiyal Rice', 'fish-ambul-thiyal-rice',
  $s$Southern-style sour fish curry$s$,
  $s$Tuna slow-cooked with goraka, black pepper and cinnamon, served with rice, dhal and sambol.$s$,
  1450.00, null, 12, 2, false
from public.categories where slug = 'rice-and-curry'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Vegetarian Rice & Curry', 'vegetarian-rice-and-curry',
  $s$Seven vegetable curries$s$,
  $s$A full vegetarian plate with dhal, beetroot, green beans, pumpkin, jackfruit, coconut sambol and papadam.$s$,
  980.00, null, 10, 3, false
from public.categories where slug = 'rice-and-curry'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Chicken Cheese Burger', 'chicken-cheese-burger',
  $s$Grilled chicken thigh, cheddar, garlic aioli$s$,
  $s$A marinated chicken thigh grilled over charcoal with melted cheddar, lettuce, tomato and garlic aioli in a toasted brioche bun. Served with fries.$s$,
  1350.00, null, 15, 1, true
from public.categories where slug = 'burgers'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Double Beef Burger', 'double-beef-burger',
  $s$Two smashed patties$s$,
  $s$Two smashed beef patties with double cheese, caramelised onion, pickles and burger sauce. Served with fries.$s$,
  1950.00, 1750.00, 18, 2, true
from public.categories where slug = 'burgers'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Crispy Veg Burger', 'crispy-veg-burger',
  $s$Spiced potato and pea patty$s$,
  $s$A crisp spiced potato and pea patty with mint chutney, lettuce and tomato. Served with fries.$s$,
  950.00, null, 12, 3, false
from public.categories where slug = 'burgers'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Margherita', 'margherita-pizza',
  $s$Tomato, mozzarella, basil$s$,
  $s$San Marzano tomato base, fior di latte mozzarella and fresh basil on hand-stretched dough.$s$,
  1650.00, null, 20, 1, false
from public.categories where slug = 'pizza'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Chicken Tikka Pizza', 'chicken-tikka-pizza',
  $s$Spiced chicken, red onion, coriander$s$,
  $s$Tandoori-spiced chicken with red onion, green chilli and coriander over a tomato and mozzarella base.$s$,
  2150.00, null, 22, 2, true
from public.categories where slug = 'pizza'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Devilled Prawn Pizza', 'devilled-prawn-pizza',
  $s$Chilli prawns and capsicum$s$,
  $s$Devilled prawns with capsicum, onion and a chilli-tomato base, finished with mozzarella.$s$,
  2650.00, null, 24, 3, false
from public.categories where slug = 'pizza'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Grilled Chicken Sub', 'grilled-chicken-sub',
  $s$Foot-long, toasted$s$,
  $s$Grilled chicken, lettuce, tomato, cucumber, onion and your choice of sauce in a toasted foot-long roll.$s$,
  1250.00, null, 12, 1, false
from public.categories where slug = 'submarines'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Meatball Marinara Sub', 'meatball-marinara-sub',
  $s$Beef meatballs in tomato sauce$s$,
  $s$Beef meatballs simmered in marinara with melted mozzarella in a toasted foot-long roll.$s$,
  1450.00, null, 14, 2, false
from public.categories where slug = 'submarines'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Fresh Lime Soda', 'fresh-lime-soda',
  $s$Sharp, cold and fizzy$s$,
  $s$Freshly squeezed lime, soda water and a pinch of salt over crushed ice.$s$,
  380.00, null, 5, 1, false
from public.categories where slug = 'beverages'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Iced Milk Coffee', 'iced-milk-coffee',
  $s$Double shot over ice$s$,
  $s$A double espresso shot shaken with milk and served over ice.$s$,
  520.00, null, 5, 2, false
from public.categories where slug = 'beverages'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'King Coconut', 'king-coconut',
  $s$Served whole and chilled$s$,
  $s$A whole chilled thambili, opened to order.$s$,
  350.00, null, 3, 3, false
from public.categories where slug = 'beverages'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Watalappan', 'watalappan',
  $s$Steamed jaggery custard$s$,
  $s$A traditional steamed custard of kithul jaggery, coconut milk and cardamom, topped with cashew.$s$,
  580.00, null, 5, 1, true
from public.categories where slug = 'desserts'
on conflict (slug) do nothing;

insert into public.food_items (category_id, name, slug, short_description, description, price, discount_price, preparation_time, display_order, is_featured)
select id, 'Chocolate Biscuit Pudding', 'chocolate-biscuit-pudding',
  $s$A Sri Lankan party classic$s$,
  $s$Layers of Marie biscuit and chocolate ganache, chilled and sliced.$s$,
  620.00, null, 5, 2, false
from public.categories where slug = 'desserts'
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- Attach option groups to the dishes that use them
-- -----------------------------------------------------------------------------

insert into public.food_item_option_groups (food_item_id, option_group_id, display_order)
select f.id, g.id, v.display_order
from (values
  ('chicken-kottu', 'Portion size', 1),
  ('chicken-kottu', 'Spice level', 2),
  ('chicken-kottu', 'Extra toppings', 3),
  ('cheese-kottu', 'Portion size', 1),
  ('cheese-kottu', 'Spice level', 2),
  ('cheese-kottu', 'Extra toppings', 3),
  ('vegetable-kottu', 'Portion size', 1),
  ('vegetable-kottu', 'Spice level', 2),
  ('chicken-rice-and-curry', 'Spice level', 1),
  ('fish-ambul-thiyal-rice', 'Spice level', 1),
  ('vegetarian-rice-and-curry', 'Spice level', 1),
  ('chicken-cheese-burger', 'Extra toppings', 1),
  ('double-beef-burger', 'Extra toppings', 1),
  ('crispy-veg-burger', 'Extra toppings', 1),
  ('margherita-pizza', 'Pizza size', 1),
  ('margherita-pizza', 'Extra toppings', 2),
  ('chicken-tikka-pizza', 'Pizza size', 1),
  ('chicken-tikka-pizza', 'Extra toppings', 2),
  ('devilled-prawn-pizza', 'Pizza size', 1),
  ('grilled-chicken-sub', 'Extra toppings', 1),
  ('meatball-marinara-sub', 'Extra toppings', 1),
  ('fresh-lime-soda', 'Drink size', 1),
  ('iced-milk-coffee', 'Drink size', 1)
) as v(food_slug, group_name, display_order)
join public.food_items f on f.slug = v.food_slug
join public.option_groups g on g.name = v.group_name
on conflict (food_item_id, option_group_id) do nothing;
