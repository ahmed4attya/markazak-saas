-- Migration m4: Add registration_requests table for new center & teacher approvals
CREATE TABLE IF NOT EXISTS registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  center_name text,
  role text DEFAULT 'teacher',
  password_hash text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  rejection_reason text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reg_requests_status ON registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_reg_requests_email ON registration_requests(email);
