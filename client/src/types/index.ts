export type Role = 'EMPLOYEE' | 'LEADER' | 'HR_ADMIN';
export type EmploymentType = 'FTE' | 'CONTRACTOR' | 'INTERN';

export interface User {
  id: string;
  vcreatek_id: string;
  full_name: string;
  email: string;
  password_hash?: string;
  role: Role;
  employment_type: EmploymentType;
  department: string;
  manager_id: string | null;
  joining_date: string;
  notice_period_start: string | null;
  is_leadership: number;
  is_active: number;
  points_balance: number;
  created_at: string;
  updated_at: string;
}

export interface EligibilityRule {
  id: string;
  employment_type: EmploymentType;
  min_months: number;
  exclude_on_notice: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export type AwardFrequency = 'ANYTIME' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';

export interface AwardType {
  id: string;
  name: string;
  description: string;
  points: number;
  value_rs: number;
  per_leader_per_year: number;
  frequency: AwardFrequency;
  needs_approval: number;
  gives_certificate: number;
  notes: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface LeaderInventory {
  id: string;
  leader_id: string;
  award_type_id: string;
  year: number;
  allocated: number;
  used: number;
  remaining: number;
  created_at: string;
  updated_at: string;
}

export type InventoryTransactionType = 'ALLOCATE' | 'REVOKE';

export interface InventoryTransaction {
  id: string;
  leader_id: string;
  award_type_id: string;
  year: number;
  type: InventoryTransactionType;
  quantity: number;
  reason: string;
  status: 'DONE';
  done_by: string;
  created_at: string;
  updated_at: string;
}

export type AwardStatus = 'PENDING_APPROVAL' | 'ISSUED' | 'REJECTED' | 'REVOKED';

export interface Award {
  id: string;
  batch_id: string;
  award_type_id: string;
  recipient_id: string;
  given_by: string;
  reason: string;
  points: number;
  value_rs: number;
  status: AwardStatus;
  approver_id: string | null;
  approved_at: string | null;
  approval_remarks: string | null;
  issued_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PointTransactionType = 'AWARD' | 'REDEEM' | 'REVERSAL' | 'ADJUSTMENT';

export interface PointTransaction {
  id: string;
  user_id: string;
  type: PointTransactionType;
  points: number;
  award_id: string | null;
  redemption_id: string | null;
  description: string;
  done_by: string;
  created_at: string;
  updated_at: string;
}

export type RedemptionStatus = 'REQUESTED' | 'UNDER_REVIEW' | 'APPROVED' | 'FULFILLED' | 'REJECTED';

export interface RedemptionRequest {
  id: string;
  user_id: string;
  points: number;
  value_rs: number;
  status: RedemptionStatus;
  voucher_provider: string | null;
  voucher_amount: number | null;
  voucher_reference: string | null;
  handled_by: string | null;
  fulfilled_at: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  _key?: string;
}

export interface Certificate {
  id: string;
  award_id: string;
  certificate_no: string;
  file_path: string;
  status: 'READY' | 'REVOKED';
  created_at: string;
  updated_at?: string;
}

export interface EmailLog {
  id: string;
  event: string;
  to_email: string;
  subject: string;
  body: string;
  related_to: string;
  related_id: string;
  status: 'SENT' | 'FAILED' | 'QUEUED';
  sent_at: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  leader_id: string;
  award_type_id: string | null;
  reason: 'NO_AWARDS_GIVEN' | 'INVENTORY_EXHAUSTED' | 'MANUAL';
  message: string;
  sent_by: string;
  sent_at: string;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  done_at: string;
  created_at: string;
  updated_at?: string;
}

export interface EligibilityResult {
  ok: boolean;
  reason: string;
}

export interface TableFilterState {
  period: 'all' | 'm0' | 'm1' | 'y0' | 'y1';
  awardTypeId: string;
  status: string;
  query: string;
}
