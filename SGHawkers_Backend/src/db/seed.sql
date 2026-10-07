-- SGHawkers demo data (generated from seed.ps1 + seed_forecast2.sql)
-- CENTRES (no emoji, plain text)
INSERT INTO centres (slug,name,area,distance_km,total_stalls,rating,eco,wait_time,dietary_tags,lat,lon) VALUES
('maxwell',    'Maxwell Food Centre',   'Tanjong Pagar',    0.3, 100, 4.7, TRUE,  'busy',     ARRAY['halal','vegetarian'], 1.2801, 103.8451),
('chomp',      'Chomp Chomp FC',        'Serangoon Gardens',8.1,  50, 4.6, FALSE, 'quiet',    ARRAY[]::TEXT[],             1.3624, 103.8681),
('tiongbahru', 'Tiong Bahru Market',   'Tiong Bahru',      1.2,  83, 4.8, TRUE,  'moderate', ARRAY['vegetarian','vegan'], 1.2847, 103.8279),
('newton',     'Newton Food Centre',   'Newton',           3.4, 100, 4.4, FALSE, 'busy',     ARRAY['halal'],              1.3083, 103.8382),
('oldairport', 'Old Airport Road FC',  'Mountbatten',      5.0, 150, 4.9, TRUE,  'moderate', ARRAY['vegetarian'],         1.3074, 103.8819),
('laupasat',   'Lau Pa Sat',           'Raffles Place',    0.8,  70, 4.3, FALSE, 'quiet',    ARRAY['halal','vegetarian'], 1.2806, 103.8503);

-- STALLS
INSERT INTO stalls (slug,centre_id,name,heritage_year,story,hawker_bio,awards,stall_type,rating,review_count,wait_mins,wait_level,eco,dietary_tags,loyalty_total,loyalty_reward) VALUES
('tianchicken',(SELECT id FROM centres WHERE slug='maxwell'),'Tian Tian Hainanese Chicken Rice','1987','Uncle Cheng family recipe, three generations from Hainan to Maxwell.','Uncle Cheng, 68, started at age 10. The chicken tells you when it is ready.',ARRAY['Michelin Bib Gourmand 2019','ST Food 100 Best'],'Chinese',4.9,2841,15,'moderate',TRUE,ARRAY['halal'],10,'Free Chicken Rice'),
('zhenzhen',(SELECT id FROM centres WHERE slug='maxwell'),'Zhen Zhen Porridge','1971','Madam Lim has been ladling porridge since 1971. Six hours of slow simmer.','Mdm Lim, 74, says porridge is medicine. Never taken a sick day.',ARRAY['SG Heritage Food 2022'],'Chinese',4.7,1204,8,'quiet',TRUE,ARRAY['vegetarian'],10,'Free Fish Congee'),
('chweekueh',(SELECT id FROM centres WHERE slug='tiongbahru'),'Tiong Bahru Chwee Kueh','1958','Same bamboo steamer trays since 1958. Steamed fresh every two hours.','Mdm Ang, 81, hands the tongs only to her granddaughter now.',ARRAY['Heritage Hawker Award 2021','Michelin Guide SG 2023'],'Singaporean',4.8,3102,5,'quiet',TRUE,ARRAY['vegetarian','vegan'],8,'Free 6-piece Chwee Kueh'),
('chartkway',(SELECT id FROM centres WHERE slug='tiongbahru'),'Tiong Bahru Char Kway Teow','1980','Fresh cockles and lard rendered each morning. A 40-year bond between man and flame.','Ah Kow, 61, trained under his father for 15 years before touching the wok.',ARRAY['ST Street Food Award 2020'],'Singaporean',4.6,987,20,'busy',FALSE,ARRAY[]::TEXT[],8,'Free Small CKT');

-- Fixed id for the demo stall so the hawker app's VITE_STALL_ID and the forecast seed match
UPDATE stalls SET id='4a6860aa-b3f8-410b-937a-a5052c30b276' WHERE slug='tianchicken';

-- MENU ITEMS
INSERT INTO menu_items (stall_id,name,description,price,cost,category,calories,eco,is_popular,is_hot,stock_level,is_sold_out,portions_left,daily_max,dietary_tags,sort_order) VALUES
((SELECT id FROM stalls WHERE slug='tianchicken'),'Chicken Rice (Roasted)','Fragrant rice with crispy-skin roasted chicken',5.50,1.80,'Main',480,FALSE,TRUE,TRUE,'low',FALSE,6,80,ARRAY['halal'],1),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Chicken Rice (Steamed)','Silky poached chicken on ginger rice',4.50,1.50,'Main',420,TRUE,TRUE,FALSE,'ok',FALSE,38,60,ARRAY['halal'],2),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Char Siew Rice','BBQ pork with jasmine rice',5.00,1.90,'Main',510,FALSE,FALSE,FALSE,'ok',FALSE,22,40,ARRAY[]::TEXT[],3),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Roasted Duck Rice','Five-spice braised duck',6.00,2.20,'Main',540,FALSE,FALSE,TRUE,'ok',TRUE,0,30,ARRAY[]::TEXT[],4),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Chicken Soup','Clear broth with ginger and pandan',2.00,0.40,'Side',80,TRUE,FALSE,FALSE,'ok',FALSE,45,60,ARRAY['halal','vegetarian'],5);

-- STAFF (PIN: 1111=owner, 2222=cashier, 3333=kitchen)
INSERT INTO hawker_staff (stall_id,name,role,pin_hash,avatar) VALUES
((SELECT id FROM stalls WHERE slug='tianchicken'),'Uncle Cheng','owner',  crypt('1111',gen_salt('bf')),'U'),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Ah Lim',     'cashier',crypt('2222',gen_salt('bf')),'A'),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Xiao Wei',   'kitchen',crypt('3333',gen_salt('bf')),'X');

-- STAFF SHIFTS (today and yesterday, SGT)
INSERT INTO shift_log (staff_id, stall_id, date, clock_in, clock_out, hours_worked)
VALUES
(
  (SELECT id FROM hawker_staff WHERE name='Uncle Cheng' AND stall_id=(SELECT id FROM stalls WHERE slug='tianchicken')),
  (SELECT id FROM stalls WHERE slug='tianchicken'),
  CURRENT_DATE,
  NOW() - INTERVAL '4 hours',
  NULL,
  NULL
),
(
  (SELECT id FROM hawker_staff WHERE name='Ah Lim' AND stall_id=(SELECT id FROM stalls WHERE slug='tianchicken')),
  (SELECT id FROM stalls WHERE slug='tianchicken'),
  CURRENT_DATE,
  NOW() - INTERVAL '3 hours',
  NOW() - INTERVAL '1 hour',
  2.00
),
(
  (SELECT id FROM hawker_staff WHERE name='Xiao Wei' AND stall_id=(SELECT id FROM stalls WHERE slug='tianchicken')),
  (SELECT id FROM stalls WHERE slug='tianchicken'),
  CURRENT_DATE - 1,
  NOW() - INTERVAL '28 hours',
  NOW() - INTERVAL '20 hours',
  8.00
);

-- STAFF NOTES
INSERT INTO staff_notes (stall_id, date, text) VALUES
(
  (SELECT id FROM stalls WHERE slug='tianchicken'),
  CURRENT_DATE,
  'Health inspection visit scheduled at 2pm. Ensure all stations are clean.'
);

-- STAFF TASKS
INSERT INTO staff_tasks (stall_id, date, title, start_time, end_time, assigned_to, color) VALUES
(
  (SELECT id FROM stalls WHERE slug='tianchicken'),
  CURRENT_DATE,
  'Deep clean kitchen',
  '14:00',
  '15:30',
  'Xiao Wei',
  'var(--teal)'
),
(
  (SELECT id FROM stalls WHERE slug='tianchicken'),
  CURRENT_DATE + 1,
  'Stock recount',
  '09:00',
  '10:00',
  'all',
  'var(--blue2)'
);

-- SETTINGS
INSERT INTO stall_settings (stall_id,open_time,close_time,phone,email,paynow_uen,paynow_name,loyalty_stamps_total,loyalty_reward,loyalty_bonus_at,loyalty_bonus_item) VALUES
((SELECT id FROM stalls WHERE slug='tianchicken'),'10:00','20:00','+65 9123 4567','tianchicken@gmail.com','202312345A','Tian Tian Hainanese Chicken Rice',10,'Free Chicken Rice',5,'Free Chicken Soup');

-- SUPPLIERS
INSERT INTO suppliers (stall_id,name,contact,email,lead_days,min_order,notes) VALUES
((SELECT id FROM stalls WHERE slug='tianchicken'),'Lim Poultry Pte Ltd','+65 9123 4567','orders@limpoultry.sg',1,50.00,'Order before 6pm for next-day delivery'),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Ah Heng Rice Trading','+65 9234 5678','ahhengtrade@gmail.com',2,30.00,'Delivers Mon/Wed/Fri only'),
((SELECT id FROM stalls WHERE slug='tianchicken'),'Far East Sauce','+65 9345 6789','orders@feasauce.sg',1,20.00,'PayNow payment required upfront');

-- DEMO CUSTOMER
INSERT INTO customers (email,password_hash,name,phone) VALUES
('demo@sghawkers.sg', crypt('demo1234', gen_salt('bf')), 'Demo User', '+65 9000 0000');

-- ─── 8 weeks of sales history for forecasting ───
DO $$
DECLARE
  sid UUID := '4a6860aa-b3f8-410b-937a-a5052c30b276';
  stf UUID := (SELECT id FROM hawker_staff WHERE stall_id = '4a6860aa-b3f8-410b-937a-a5052c30b276' AND role = 'owner' LIMIT 1);
  tid UUID;
  i INT;
  d TIMESTAMP;
  dow INT;
  beansprout_qty INT;
  duck_qty INT;
BEGIN
  FOR i IN 1..56 LOOP
    d := (CURRENT_DATE - i) + TIME '12:00:00';
    dow := EXTRACT(DOW FROM d);
    beansprout_qty := CASE WHEN dow IN (0,6) THEN 6 ELSE 3 END;
    duck_qty       := CASE WHEN dow IN (0,6) THEN 4 ELSE 2 END;

    INSERT INTO transactions (stall_id,staff_id,txn_ref,subtotal,discount,total,method,created_at)
    VALUES (sid, stf, 'DEMO2-'||i,
      (beansprout_qty*3.00 + duck_qty*6.00), 0,
      (beansprout_qty*3.00 + duck_qty*6.00),
      'cash'::payment_method, d)
    RETURNING id INTO tid;

    INSERT INTO transaction_items (transaction_id,name,qty,unit_price,subtotal) VALUES
      (tid,'Plain Beansprouts', beansprout_qty, 3.00, beansprout_qty*3.00),
      (tid,'Roasted Duck Rice', duck_qty,       6.00, duck_qty*6.00);
  END LOOP;
  RAISE NOTICE 'Done';
END $$;
