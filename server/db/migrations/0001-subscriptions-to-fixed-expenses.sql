-- subscriptions -> fixed_expenses
--
-- Drizzle push no sabe renombrar sin preguntar: en modo no interactivo trata
-- un renombrado como "borrar la tabla vieja y crear la nueva", y eso se lleva
-- por delante las filas. Por eso el renombrado va a mano, con ALTER, que
-- conserva los datos. Se corre ANTES de desplegar el codigo nuevo.
--
-- Es idempotente: correrlo dos veces no rompe nada.
DO $$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    ALTER TABLE subscriptions RENAME TO fixed_expenses;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'fixed_expenses' AND column_name = 'next_charge') THEN
    ALTER TABLE fixed_expenses RENAME COLUMN next_charge TO next_payment;
  END IF;
  IF to_regclass('public.subscriptions_pkey') IS NOT NULL THEN
    ALTER INDEX subscriptions_pkey RENAME TO fixed_expenses_pkey;
  END IF;
  IF to_regclass('public.subscriptions_user_idx') IS NOT NULL THEN
    ALTER INDEX subscriptions_user_idx RENAME TO fixed_expenses_user_idx;
  END IF;
END $$;

-- Las restricciones (claves foraneas y NOT NULL) conservan el nombre viejo
-- tras renombrar la tabla; si se quedan asi, un db:push posterior intenta
-- recrearlas.
DO $$
DECLARE c record;
BEGIN
  FOR c IN SELECT conname FROM pg_constraint
            WHERE conrelid = 'fixed_expenses'::regclass AND conname LIKE 'subscriptions%'
  LOOP
    EXECUTE format('ALTER TABLE fixed_expenses RENAME CONSTRAINT %I TO %I',
                   c.conname, replace(c.conname, 'subscriptions', 'fixed_expenses'));
  END LOOP;
END $$;
