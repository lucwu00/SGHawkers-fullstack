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