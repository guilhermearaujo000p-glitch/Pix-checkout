-- Recebedores oficiais e split 99% colaborador / 1% principal. Nenhum usuário ou senha é criado aqui.
INSERT INTO "recipients" ("id", "label", "kind") VALUES
  ('re_cmuykrmjuek7n0l9t05hndzls', 'Recebedor principal', 'principal'),
  ('re_cmvfm5b8b04sk0l9t74hfy2dq', 'ANDRE CICERO DA SILVA JUNIOR', 'collaborator'),
  ('re_cmvfmiz10085y0l9tre7vbfbm', 'MARIANA CAROLINE FERNANDES JACINTHO', 'collaborator'),
  ('re_cmvft1e190sdz0m9tij4qq22l', 'Rodrigo Oliveira Lopes', 'collaborator'),
  ('re_cmvg409fu2ra40l9tvm7e5kww', 'Thalwan Júnior Ribeiro Laturdes Vasconcelos', 'collaborator')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "checkout_settings" ("id", "display_name", "principal_recipient_id", "principal_split_percent")
VALUES (1, 'Checkout PIX', 're_cmuykrmjuek7n0l9t05hndzls', 1)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "collaborators" ("slug", "name", "title", "recipient_id", "split_percent") VALUES
  ('andre', 'ANDRE CICERO DA SILVA JUNIOR', 'PIX André', 're_cmvfm5b8b04sk0l9t74hfy2dq', 99),
  ('mariana', 'MARIANA CAROLINE FERNANDES JACINTHO', 'PIX Mariana', 're_cmvfmiz10085y0l9tre7vbfbm', 99),
  ('rodrigo', 'Rodrigo Oliveira Lopes', 'PIX Rodrigo', 're_cmvft1e190sdz0m9tij4qq22l', 99),
  ('thalwan', 'Thalwan Júnior Ribeiro Laturdes Vasconcelos', 'PIX Thalwan', 're_cmvg409fu2ra40l9tvm7e5kww', 99)
ON CONFLICT ("slug") DO NOTHING;
