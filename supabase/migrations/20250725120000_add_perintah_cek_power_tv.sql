-- ALTER TABLE untuk menambah field perintah_cek_power_tv pada tabel consoles
ALTER TABLE consoles
ADD COLUMN perintah_cek_power_tv TEXT;

ALTER TABLE cashier_transactions ADD COLUMN IF NOT EXISTS details jsonb;
