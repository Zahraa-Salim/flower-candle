-- شغف — demo seed, identical to src/data/products.ts and src/data/categories.ts.
-- Safe to re-run: existing rows are updated, missing ones inserted (upsert by id).

insert into categories (id, name, description, image, sort_order) values
  ('bouquets', 'باقات',    'باقات من شموع الورد، منسّقة يدوياً لتُهدى.',      'https://images.unsplash.com/photo-1523693916903-027d144a2b7d?auto=format&fit=crop&q=75&w=800', 1),
  ('roses',    'ورود',     'وردة واحدة تكفي أحياناً لتقول كل شيء.',            'https://images.unsplash.com/photo-1771142480968-6036543055f7?auto=format&fit=crop&q=75&w=800', 2),
  ('gifts',    'هدايا',    'قطع صغيرة مغلّفة بعناية لكل مناسبة.',              'https://images.unsplash.com/photo-1689085055401-2e6a7268d6ca?auto=format&fit=crop&q=75&w=800', 3),
  ('favors',   'توزيعات',  'تشكيلات للأعراس والاحتفالات والضيافة.',           'https://images.unsplash.com/photo-1707746003755-ef65403a4808?auto=format&fit=crop&q=75&w=800', 4)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, image = excluded.image, sort_order = excluded.sort_order;

insert into products
  (id, name, description, price, category, image, images, available, featured, is_new, is_category_cover, flowers_count, color, size, handmade, created_at)
values
  ('pink-rose-bouquet', 'باقة الورد الوردية',
   'باقة من شموع الورد المصنوعة يدوياً، بتدرجات وردية ناعمة، صُممت لتكون هدية جميلة للمناسبات واللحظات الخاصة.',
   25.00, 'bouquets',
   'https://images.unsplash.com/photo-1782038522299-c1568390810f?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1782038522299-c1568390810f?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1707746003755-ef65403a4808?auto=format&fit=crop&q=75&w=800',
         'https://images.unsplash.com/photo-1771142480968-6036543055f7?auto=format&fit=crop&q=75&w=800'],
   true, true, false, true, 7, 'وردي', 'متوسط', true, '2026-06-02T10:00:00Z'),

  ('spring-bouquet', 'باقة الربيع',
   'مزيج من الورود الوردية والبيضاء بلمسات خضراء، تحمل معها إحساس الصباحات الربيعية الهادئة. مناسبة للهدايا وتزيين الطاولات.',
   30.00, 'bouquets',
   'https://images.unsplash.com/photo-1523693916903-027d144a2b7d?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1523693916903-027d144a2b7d?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1689085055401-2e6a7268d6ca?auto=format&fit=crop&q=75&w=800'],
   true, true, true, false, 9, 'وردي وأبيض', 'كبير', true, '2026-08-20T10:00:00Z'),

  ('sunset-bouquet', 'باقة الغروب',
   'ورود بألوان الخوخ والمشمش ولمسات خزامى، مستوحاة من دفء الغروب. باقة تناسب من تحب الألوان الدافئة.',
   28.00, 'bouquets',
   'https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1753992243182-ba388674e699?auto=format&fit=crop&q=75&w=800'],
   true, true, false, false, 8, 'خوخي', 'متوسط', true, '2026-07-11T10:00:00Z'),

  ('white-rose', 'ورد أبيض',
   'شمعة على شكل وردة بيضاء بملمس ناعم ورائحة هادئة. قطعة بسيطة تليق بكل مكان وكل مناسبة.',
   12.00, 'roses',
   'https://images.unsplash.com/photo-1610247672619-df289f408ff2?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1610247672619-df289f408ff2?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1592967937268-ac2b12bb2cb1?auto=format&fit=crop&q=75&w=800'],
   true, false, false, true, 1, 'أبيض', 'صغير', true, '2026-05-15T10:00:00Z'),

  ('pink-rose', 'وردة وردية',
   'وردة واحدة بلون وردي هادئ، مصنوعة يدوياً بعناية. أحياناً تكفي وردة واحدة لتقول ما تريدين.',
   10.00, 'roses',
   'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1771142480968-6036543055f7?auto=format&fit=crop&q=75&w=800'],
   true, true, false, false, 1, 'وردي', 'صغير', true, '2026-05-15T11:00:00Z'),

  ('small-gift', 'هدية صغيرة',
   'علبة هدية مغلّفة بورق مزهر وشريط وردي، بداخلها شمعتان على شكل وردة. لأن الهدية الجميلة لا تحتاج مناسبة.',
   18.00, 'gifts',
   'https://images.unsplash.com/photo-1646182504958-560a709fd368?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1646182504958-560a709fd368?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1689085055401-2e6a7268d6ca?auto=format&fit=crop&q=75&w=800'],
   true, true, true, true, 2, 'وردي فاتح', 'صغير', true, '2026-09-01T10:00:00Z'),

  ('occasion-bouquet', 'باقة المناسبات',
   'تشكيلة كبيرة من شموع الورد بألوان الكريم والخوخ، مربوطة بشريط حريري. مثالية للأعراس والتوزيعات والاحتفالات.',
   35.00, 'favors',
   'https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1563241527-3004b7be0ffd?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&q=75&w=800'],
   false, false, false, true, 12, 'كريمي وخوخي', 'كبير', true, '2026-04-05T10:00:00Z'),

  ('peach-rose', 'ورد بلون الخوخ',
   'شمعة وردة بلون الخوخ الدافئ، بتدرج لوني ناعم يشبه ضوء الصباح. تُهدى وحدها أو ضمن تنسيق.',
   14.00, 'roses',
   'https://images.unsplash.com/photo-1760606800342-8889a99a8170?auto=format&fit=crop&q=75&w=900',
   array['https://images.unsplash.com/photo-1760606800342-8889a99a8170?auto=format&fit=crop&q=75&w=900',
         'https://images.unsplash.com/photo-1753992243182-ba388674e699?auto=format&fit=crop&q=75&w=800'],
   true, false, true, false, 1, 'خوخي', 'صغير', true, '2026-08-28T10:00:00Z')
on conflict (id) do update set
  name = excluded.name, description = excluded.description, price = excluded.price, category = excluded.category,
  image = excluded.image, images = excluded.images, available = excluded.available, featured = excluded.featured,
  is_new = excluded.is_new, is_category_cover = excluded.is_category_cover, flowers_count = excluded.flowers_count,
  color = excluded.color, size = excluded.size, handmade = excluded.handmade, created_at = excluded.created_at;

-- Hero images start with the app defaults (no row needed); an admin upload creates the 'hero' row.
