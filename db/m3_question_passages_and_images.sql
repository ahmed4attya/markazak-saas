-- M3: Add reading passage and figure/image support to questions (Qudurat Verbal & Quantitative parity)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS passage text DEFAULT NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_questions_passage ON questions(tenant_id) WHERE passage IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_image ON questions(tenant_id) WHERE image_url IS NOT NULL;
