import React, { createContext, useState, useEffect, ReactNode } from 'react';
import * as XLSX from 'xlsx';
import {
  User,
  EligibilityRule,
  AwardType,
  LeaderInventory,
  InventoryTransaction,
  Award,
  PointTransaction,
  RedemptionRequest,
  Certificate,
  EmailLog,
  Reminder,
  AuditLog,
  EligibilityResult,
  RedemptionStatus,
} from '../types';
import { INITIAL_SEED_DATA, SeedData } from '../api/seedData';

const STORAGE_KEY = 'rr_seed_data_v1';

export interface DataContextType {
  data: SeedData;
  getUser: (id: string) => User | undefined;
  getUserName: (id: string) => string;
  getAwardType: (id: string) => AwardType | undefined;
  getAwardTypeName: (id: string) => string;
  getSetting: (key: string, defaultVal?: string) => string;
  getRupeeRate: () => number;
  getUserBalance: (userId: string) => number;
  checkEligibility: (user: User, onDate?: Date) => EligibilityResult;
  getLeaderInventory: (leaderId: string, awardTypeId: string, year?: number) => LeaderInventory | undefined;
  giveAward: (giverId: string, recipientIds: string[], typeId: string, reason: string) => { ok?: boolean; pending?: boolean; error?: string; created?: Award[] };
  decideAward: (batchId: string, approve: boolean, remarks?: string) => void;
  revokeAward: (awardId: string, reason: string) => { ok?: boolean; error?: string };
  requestRedemption: (userId: string, points: number) => { ok?: boolean; error?: string; request?: RedemptionRequest };
  updateRedemption: (id: string, status: RedemptionStatus, fields: Partial<RedemptionRequest>) => { ok?: boolean; error?: string };
  allocateInventory: (leaderId: string, quantities: Record<string, number>, reason: string) => { ok?: boolean; error?: string };
  revokeInventoryUnits: (leaderId: string, typeId: string, qty: number, reason: string) => { ok?: boolean; error?: string };
  sendReminder: (leaderId: string, typeId: string | null, reasonCode: 'NO_AWARDS_GIVEN' | 'INVENTORY_EXHAUSTED' | 'MANUAL', message: string, senderId: string) => void;
  saveAwardType: (type: AwardType) => void;
  addAwardType: (type: Omit<AwardType, 'id' | 'created_at' | 'updated_at'>) => void;
  saveEligibilityRule: (rule: EligibilityRule) => void;
  saveSetting: (key: string, value: string) => void;
  exportToExcel: () => void;
  importFromExcel: (buffer: ArrayBuffer) => { ok?: boolean; error?: string; loadedCount?: number };
  resetData: () => void;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

const uuid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });

const nowIso = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const currentYear = () => new Date().getFullYear();

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SeedData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored seed data', e);
    }
    return INITIAL_SEED_DATA;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }, [data]);

  const getUser = (id: string): User | undefined => data.users.find((u) => u.id === id);
  const getUserName = (id: string): string => getUser(id)?.full_name || 'Unknown';
  const getAwardType = (id: string): AwardType | undefined => data.award_types.find((a) => a.id === id);
  const getAwardTypeName = (id: string): string => getAwardType(id)?.name || 'Unknown Award';
  const getSetting = (key: string, defaultVal = ''): string => {
    const s = data.settings.find((x) => x.key === key);
    return s ? s.value : defaultVal;
  };

  const getRupeeRate = (): number => parseFloat(getSetting('rupee_per_point', '0.5')) || 0.5;

  const getUserBalance = (userId: string): number => {
    return data.point_transactions
      .filter((t) => t.user_id === userId)
      .reduce((sum, t) => sum + Number(t.points), 0);
  };

  const checkEligibility = (u: User, onDate: Date = new Date()): EligibilityResult => {
    if (!u.is_active) {
      return { ok: false, reason: 'Inactive employee' };
    }
    if (u.is_leadership) {
      return { ok: false, reason: 'Leadership members can give awards but are not eligible to receive them' };
    }
    const rule = data.eligibility_rules.find((r) => r.employment_type === u.employment_type && r.is_active);
    if (!rule) {
      return { ok: false, reason: `No active policy defined for ${u.employment_type}` };
    }

    const joinDate = new Date(u.joining_date);
    let months = (onDate.getFullYear() - joinDate.getFullYear()) * 12 + (onDate.getMonth() - joinDate.getMonth());
    if (onDate.getDate() < joinDate.getDate()) {
      months--;
    }

    if (months < rule.min_months) {
      const eligibleDate = new Date(joinDate);
      eligibleDate.setMonth(eligibleDate.getMonth() + Number(rule.min_months));
      const formattedDate = eligibleDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return {
        ok: false,
        reason: `Tenure is ${months} months (minimum ${rule.min_months} months required). Eligible from ${formattedDate}`,
      };
    }

    if (rule.exclude_on_notice && u.notice_period_start) {
      const noticeDate = new Date(u.notice_period_start);
      if (noticeDate <= onDate) {
        return { ok: false, reason: 'Serving notice period' };
      }
    }

    return { ok: true, reason: `Eligible (${u.employment_type}, ${months} months tenure)` };
  };

  const getLeaderInventory = (leaderId: string, awardTypeId: string, year = currentYear()): LeaderInventory | undefined => {
    return data.leader_inventory.find(
      (inv) => inv.leader_id === leaderId && inv.award_type_id === awardTypeId && Number(inv.year) === year
    );
  };

  const getApproverFor = (giverId: string): string | null => {
    const giver = getUser(giverId);
    if (giver?.manager_id && getUser(giver.manager_id)?.is_active) {
      return giver.manager_id;
    }
    const hr = data.users.find((u) => u.role === 'HR_ADMIN' && u.is_active);
    return hr ? hr.id : null;
  };

  const createCertificate = (awardId: string): string => {
    const certNumber = `RR-${currentYear()}-${String(data.certificates.length + 1).padStart(4, '0')}`;
    const cert: Certificate = {
      id: uuid(),
      award_id: awardId,
      certificate_no: certNumber,
      file_path: `certificates/${currentYear()}/${certNumber}.pdf`,
      status: 'READY',
      created_at: nowIso(),
    };
    setData((prev) => ({
      ...prev,
      certificates: [...prev.certificates, cert],
    }));
    return certNumber;
  };

  const addAuditLog = (action: string, table: string, recordId: string, oldV: unknown, newV: unknown, reason?: string | null) => {
    const entry: AuditLog = {
      id: uuid(),
      user_id: null,
      action,
      table_name: table,
      record_id: recordId,
      old_value: oldV ? JSON.stringify(oldV) : null,
      new_value: newV ? JSON.stringify(newV) : null,
      reason: reason || null,
      done_at: nowIso(),
      created_at: nowIso(),
    };
    setData((prev) => ({
      ...prev,
      audit_log: [...prev.audit_log, entry],
    }));
  };

  const addEmailLog = (event: string, toEmail: string, subject: string, body: string, relatedTo: string, relatedId: string) => {
    const email: EmailLog = {
      id: uuid(),
      event,
      to_email: toEmail,
      subject,
      body,
      related_to: relatedTo,
      related_id: relatedId,
      status: 'SENT',
      sent_at: nowIso(),
      error: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    setData((prev) => ({
      ...prev,
      email_log: [...prev.email_log, email],
    }));
  };

  const addPointTransaction = (userId: string, type: 'AWARD' | 'REDEEM' | 'REVERSAL' | 'ADJUSTMENT', points: number, desc: string, awardId?: string | null, redId?: string | null, doneBy = 'system') => {
    const ptx: PointTransaction = {
      id: uuid(),
      user_id: userId,
      type,
      points,
      award_id: awardId || null,
      redemption_id: redId || null,
      description: desc,
      done_by: doneBy,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    setData((prev) => ({
      ...prev,
      point_transactions: [...prev.point_transactions, ptx],
      users: prev.users.map((u) => (u.id === userId ? { ...u, points_balance: Number(u.points_balance || 0) + points } : u)),
    }));
  };

  const giveAward = (giverId: string, recipientIds: string[], typeId: string, reason: string) => {
    const at = getAwardType(typeId);
    if (!at || !at.is_active) {
      return { error: 'The selected award type is not active.' };
    }
    if (!reason || reason.trim().length < 20) {
      return { error: 'Please enter a detailed justification of at least 20 characters.' };
    }
    if (!recipientIds.length) {
      return { error: 'Please select at least one recipient.' };
    }

    const issues: string[] = [];
    for (const rid of recipientIds) {
      if (rid === giverId) {
        issues.push(`${getUserName(rid)}: You cannot award yourself.`);
      } else {
        const u = getUser(rid);
        if (u) {
          const el = checkEligibility(u);
          if (!el.ok) {
            issues.push(`${u.full_name}: ${el.reason}`);
          }
        }
      }
    }
    if (issues.length > 0) {
      return { error: `Eligibility criteria not met: ${issues.join(' | ')}` };
    }

    const inv = getLeaderInventory(giverId, typeId);
    const available = inv ? Number(inv.remaining) : 0;
    if (available < recipientIds.length) {
      return { error: `Insufficient inventory. You have ${available} ${at.name} units remaining, but requested ${recipientIds.length}.` };
    }

    const batchId = uuid();
    const needsApproval = Boolean(Number(at.needs_approval));
    const approverId = needsApproval ? getApproverFor(giverId) : null;
    const now = nowIso();

    // Deduct remaining units
    const updatedLeaderInventory = data.leader_inventory.map((i) => {
      if (i.leader_id === giverId && i.award_type_id === typeId && Number(i.year) === currentYear()) {
        return {
          ...i,
          used: Number(i.used) + recipientIds.length,
          remaining: Number(i.remaining) - recipientIds.length,
          updated_at: now,
        };
      }
      return i;
    });

    const newAwards: Award[] = recipientIds.map((rid) => ({
      id: uuid(),
      batch_id: batchId,
      award_type_id: typeId,
      recipient_id: rid,
      given_by: giverId,
      reason: reason.trim(),
      points: Number(at.points),
      value_rs: Number(at.value_rs),
      status: needsApproval ? 'PENDING_APPROVAL' : 'ISSUED',
      approver_id: approverId,
      approved_at: null,
      approval_remarks: null,
      issued_at: needsApproval ? null : now,
      revoked_at: null,
      revoke_reason: null,
      created_at: now,
      updated_at: now,
    }));

    setData((prev) => ({
      ...prev,
      leader_inventory: updatedLeaderInventory,
      awards: [...prev.awards, ...newAwards],
    }));

    // Post-creation side-effects
    for (const a of newAwards) {
      addAuditLog('AWARD_GIVEN', 'awards', a.id, null, { award_type: at.name, recipient: getUserName(a.recipient_id), points: a.points, status: a.status }, reason);
      if (needsApproval && approverId) {
        const approverUser = getUser(approverId);
        if (approverUser) {
          addEmailLog(
            'APPROVAL_REQUIRED',
            approverUser.email,
            `Approval required: ${at.name} nomination for ${getUserName(a.recipient_id)}`,
            `${getUserName(giverId)} has submitted a ${at.name} award for ${getUserName(a.recipient_id)}. Reason: ${a.reason}`,
            'award',
            a.id
          );
        }
      } else {
        // Direct issuance
        if (Number(a.points) > 0) {
          addPointTransaction(a.recipient_id, 'AWARD', Number(a.points), `${at.name} award from ${getUserName(a.given_by)}`, a.id, null, giverId);
        }
        if (Number(at.gives_certificate)) {
          createCertificate(a.id);
        }
        const giverUser = getUser(giverId);
        const recipUser = getUser(a.recipient_id);
        if (giverUser) {
          addEmailLog('AWARD_GIVEN', giverUser.email, `You gave a ${at.name} award to ${getUserName(a.recipient_id)}`, `Your ${at.name} award has been issued. Reason: ${a.reason}`, 'award', a.id);
        }
        if (recipUser) {
          addEmailLog('AWARD_RECEIVED', recipUser.email, `Congratulations! You received a ${at.name} award`, `${getUserName(giverId)} recognized you with a ${at.name} award worth ${a.points} points. Reason: ${a.reason}`, 'award', a.id);
        }
      }
    }

    return { ok: true, pending: needsApproval, created: newAwards };
  };

  const decideAward = (batchId: string, approve: boolean, remarks?: string) => {
    const matchingAwards = data.awards.filter((a) => a.batch_id === batchId && a.status === 'PENDING_APPROVAL');
    if (!matchingAwards.length) return;

    const now = nowIso();

    setData((prev) => {
      let updatedInventory = prev.leader_inventory;
      const updatedAwards = prev.awards.map((a) => {
        if (a.batch_id === batchId && a.status === 'PENDING_APPROVAL') {
          return {
            ...a,
            status: (approve ? 'ISSUED' : 'REJECTED') as 'ISSUED' | 'REJECTED',
            approved_at: now,
            approval_remarks: remarks || null,
            issued_at: approve ? now : null,
            updated_at: now,
          };
        }
        return a;
      });

      if (!approve) {
        // Restore units back to leader inventory
        for (const a of matchingAwards) {
          updatedInventory = updatedInventory.map((inv) => {
            if (inv.leader_id === a.given_by && inv.award_type_id === a.award_type_id && Number(inv.year) === currentYear()) {
              return {
                ...inv,
                used: Math.max(0, Number(inv.used) - 1),
                remaining: Number(inv.remaining) + 1,
                updated_at: now,
              };
            }
            return inv;
          });
        }
      }

      return {
        ...prev,
        awards: updatedAwards,
        leader_inventory: updatedInventory,
      };
    });

    for (const a of matchingAwards) {
      const at = getAwardType(a.award_type_id);
      if (approve) {
        if (Number(a.points) > 0) {
          addPointTransaction(a.recipient_id, 'AWARD', Number(a.points), `${at?.name || 'Award'} from ${getUserName(a.given_by)}`, a.id, null, a.approver_id || 'system');
        }
        if (at && Number(at.gives_certificate)) {
          createCertificate(a.id);
        }
        addAuditLog('AWARD_APPROVED', 'awards', a.id, { status: 'PENDING_APPROVAL' }, { status: 'ISSUED' }, remarks);
        const giverUser = getUser(a.given_by);
        const recipUser = getUser(a.recipient_id);
        if (giverUser) addEmailLog('AWARD_APPROVED', giverUser.email, `Award approved for ${getUserName(a.recipient_id)}`, `Remarks: ${remarks || 'Approved'}`, 'award', a.id);
        if (recipUser) addEmailLog('AWARD_RECEIVED', recipUser.email, `Congratulations! You received a ${at?.name} award`, `Reason: ${a.reason}`, 'award', a.id);
      } else {
        addAuditLog('AWARD_REJECTED', 'awards', a.id, { status: 'PENDING_APPROVAL' }, { status: 'REJECTED' }, remarks);
        const giverUser = getUser(a.given_by);
        if (giverUser) addEmailLog('AWARD_REJECTED', giverUser.email, `${at?.name} award for ${getUserName(a.recipient_id)} was rejected`, `Remarks: ${remarks || ''}`, 'award', a.id);
      }
    }
  };

  const revokeAward = (awardId: string, reason: string) => {
    const a = data.awards.find((x) => x.id === awardId);
    if (!a || a.status !== 'ISSUED') {
      return { error: 'Only issued awards can be revoked.' };
    }
    if (!reason || reason.trim().length < 5) {
      return { error: 'A justification of at least 5 characters is required for revocation.' };
    }
    const currentBalance = getUserBalance(a.recipient_id);
    if (currentBalance < Number(a.points)) {
      return {
        error: `Cannot revoke: ${getUserName(a.recipient_id)} has already redeemed these points. Available balance is ${currentBalance} points, but this award is worth ${a.points} points.`,
      };
    }

    const now = nowIso();
    setData((prev) => ({
      ...prev,
      awards: prev.awards.map((x) => (x.id === awardId ? { ...x, status: 'REVOKED', revoked_at: now, revoke_reason: reason.trim(), updated_at: now } : x)),
    }));

    if (Number(a.points) > 0) {
      addPointTransaction(a.recipient_id, 'REVERSAL', -Number(a.points), `${getAwardTypeName(a.award_type_id)} award revoked by HR`, a.id, null);
    }
    addAuditLog('AWARD_REVOKED', 'awards', a.id, { status: 'ISSUED' }, { status: 'REVOKED' }, reason);
    const recip = getUser(a.recipient_id);
    if (recip) {
      addEmailLog('AWARD_REVOKED', recip.email, `Your ${getAwardTypeName(a.award_type_id)} award has been revoked`, `Reason: ${reason}`, 'award', a.id);
    }

    return { ok: true };
  };

  const requestRedemption = (userId: string, points: number) => {
    const minPoints = Number(getSetting('min_redeem_points', '500'));
    const cleanPoints = Number(points);
    if (!cleanPoints || cleanPoints <= 0) {
      return { error: 'Please enter a valid points value to redeem.' };
    }
    if (cleanPoints < minPoints) {
      return { error: `Minimum redemption threshold is ${minPoints} points.` };
    }
    if (cleanPoints % 100 !== 0) {
      return { error: 'Redemption points must be in increments of 100.' };
    }
    const balance = getUserBalance(userId);
    if (cleanPoints > balance) {
      return { error: `Insufficient points balance. You have ${balance} points available.` };
    }

    const reqKey = `RD-${currentYear()}-${String(data.redemption_requests.length + 1).padStart(3, '0')}`;
    const valueRs = cleanPoints * getRupeeRate();
    const now = nowIso();

    const newReq: RedemptionRequest = {
      id: uuid(),
      user_id: userId,
      points: cleanPoints,
      value_rs: valueRs,
      status: 'REQUESTED',
      voucher_provider: null,
      voucher_amount: null,
      voucher_reference: null,
      handled_by: null,
      fulfilled_at: null,
      remarks: null,
      created_at: now,
      updated_at: now,
      _key: reqKey,
    };

    setData((prev) => ({
      ...prev,
      redemption_requests: [...prev.redemption_requests, newReq],
    }));

    addPointTransaction(userId, 'REDEEM', -cleanPoints, `Redemption request ${reqKey} for Rs ${valueRs} voucher`, null, newReq.id, userId);
    addAuditLog('REDEMPTION_REQUESTED', 'redemption_requests', newReq.id, null, { points: cleanPoints, value_rs: valueRs }, null);

    const userObj = getUser(userId);
    if (userObj) {
      addEmailLog('REDEMPTION_REQUESTED', userObj.email, `Redemption request received: ${cleanPoints} points`, `We have received your redemption request for a Rs ${valueRs} voucher.`, 'redemption', newReq.id);
    }
    const hrEmail = getSetting('hr_email', 'hr@vcreatek.com');
    addEmailLog('REDEMPTION_REQUESTED_HR', hrEmail, `New redemption request from ${getUserName(userId)}`, `${getUserName(userId)} requested ${cleanPoints} points = Rs ${valueRs}.`, 'redemption', newReq.id);

    return { ok: true, request: newReq };
  };

  const updateRedemption = (id: string, newStatus: RedemptionStatus, fields: Partial<RedemptionRequest>) => {
    const r = data.redemption_requests.find((x) => x.id === id);
    if (!r) return { error: 'Redemption request not found.' };

    const oldStatus = r.status;
    const allowedTransitions: Record<RedemptionStatus, RedemptionStatus[]> = {
      REQUESTED: ['UNDER_REVIEW', 'APPROVED', 'REJECTED'],
      UNDER_REVIEW: ['APPROVED', 'REJECTED'],
      APPROVED: ['FULFILLED', 'REJECTED'],
      FULFILLED: [],
      REJECTED: [],
    };

    if (!allowedTransitions[oldStatus].includes(newStatus)) {
      return { error: `Invalid transition from ${oldStatus} to ${newStatus}.` };
    }

    const now = nowIso();
    const updatedReq: RedemptionRequest = {
      ...r,
      ...fields,
      status: newStatus,
      updated_at: now,
      fulfilled_at: newStatus === 'FULFILLED' ? now : r.fulfilled_at,
      voucher_amount: newStatus === 'FULFILLED' ? fields.voucher_amount || r.value_rs : r.voucher_amount,
    };

    setData((prev) => ({
      ...prev,
      redemption_requests: prev.redemption_requests.map((x) => (x.id === id ? updatedReq : x)),
    }));

    if (newStatus === 'REJECTED') {
      // Refund points
      addPointTransaction(r.user_id, 'ADJUSTMENT', Number(r.points), 'Redemption request rejected; points returned', null, r.id);
    }

    addAuditLog('REDEMPTION_STATUS_CHANGED', 'redemption_requests', r.id, { status: oldStatus }, { status: newStatus }, fields.remarks);
    const u = getUser(r.user_id);
    if (u) {
      addEmailLog(
        'REDEMPTION_STATUS_CHANGED',
        u.email,
        `Your redemption request status: ${newStatus.replace('_', ' ')}`,
        fields.remarks || `Status updated to ${newStatus}`,
        'redemption',
        r.id
      );
    }

    return { ok: true };
  };

  const allocateInventory = (leaderId: string, quantities: Record<string, number>, reason: string) => {
    let hasUnits = false;
    const now = nowIso();
    const newTxns: InventoryTransaction[] = [];

    setData((prev) => {
      let invList = [...prev.leader_inventory];
      for (const [typeId, rawQty] of Object.entries(quantities)) {
        const qty = Number(rawQty);
        if (qty <= 0) continue;
        hasUnits = true;

        const existing = invList.find((i) => i.leader_id === leaderId && i.award_type_id === typeId && Number(i.year) === currentYear());
        if (existing) {
          invList = invList.map((i) =>
            i.id === existing.id
              ? {
                  ...i,
                  allocated: Number(i.allocated) + qty,
                  remaining: Number(i.remaining) + qty,
                  updated_at: now,
                }
              : i
          );
        } else {
          invList.push({
            id: uuid(),
            leader_id: leaderId,
            award_type_id: typeId,
            year: currentYear(),
            allocated: qty,
            used: 0,
            remaining: qty,
            created_at: now,
            updated_at: now,
          });
        }

        const txn: InventoryTransaction = {
          id: uuid(),
          leader_id: leaderId,
          award_type_id: typeId,
          year: currentYear(),
          type: 'ALLOCATE',
          quantity: qty,
          reason,
          status: 'DONE',
          done_by: 'HR Admin',
          created_at: now,
          updated_at: now,
        };
        newTxns.push(txn);
      }

      return {
        ...prev,
        leader_inventory: invList,
        inventory_transactions: [...prev.inventory_transactions, ...newTxns],
      };
    });

    if (!hasUnits) {
      return { error: 'Please enter at least one quantity greater than 0.' };
    }

    for (const t of newTxns) {
      addAuditLog('INVENTORY_ALLOCATED', 'inventory_transactions', t.id, null, { manager: getUserName(leaderId), award_type: getAwardTypeName(t.award_type_id), quantity: t.quantity }, reason);
    }

    const leader = getUser(leaderId);
    if (leader) {
      addEmailLog('ALLOCATION_RECEIVED', leader.email, `Award units allocated for ${currentYear()}`, `Reason: ${reason}`, 'allocation', leaderId);
    }

    return { ok: true };
  };

  const revokeInventoryUnits = (leaderId: string, typeId: string, qty: number, reason: string) => {
    const cleanQty = Number(qty);
    const inv = getLeaderInventory(leaderId, typeId);
    if (!inv || cleanQty <= 0) {
      return { error: 'Please specify a valid quantity to revoke.' };
    }
    if (cleanQty > Number(inv.remaining)) {
      return { error: `Cannot revoke ${cleanQty} units. Only ${inv.remaining} unused units remain.` };
    }
    if (!reason || reason.trim().length < 5) {
      return { error: 'Please provide a clear justification of at least 5 characters.' };
    }

    const now = nowIso();
    const txn: InventoryTransaction = {
      id: uuid(),
      leader_id: leaderId,
      award_type_id: typeId,
      year: currentYear(),
      type: 'REVOKE',
      quantity: cleanQty,
      reason,
      status: 'DONE',
      done_by: 'HR Admin',
      created_at: now,
      updated_at: now,
    };

    setData((prev) => ({
      ...prev,
      leader_inventory: prev.leader_inventory.map((i) =>
        i.id === inv.id
          ? {
              ...i,
              allocated: Number(i.allocated) - cleanQty,
              remaining: Number(i.remaining) - cleanQty,
              updated_at: now,
            }
          : i
      ),
      inventory_transactions: [...prev.inventory_transactions, txn],
    }));

    addAuditLog('INVENTORY_REVOKED', 'inventory_transactions', txn.id, null, { manager: getUserName(leaderId), award_type: getAwardTypeName(typeId), quantity: cleanQty }, reason);
    const leader = getUser(leaderId);
    if (leader) {
      addEmailLog('INVENTORY_ADJUSTED', leader.email, `Inventory adjusted: ${cleanQty} ${getAwardTypeName(typeId)} units revoked`, `Reason: ${reason}`, 'allocation', txn.id);
    }

    return { ok: true };
  };

  const sendReminder = (leaderId: string, typeId: string | null, reasonCode: 'NO_AWARDS_GIVEN' | 'INVENTORY_EXHAUSTED' | 'MANUAL', message: string, senderId: string) => {
    const now = nowIso();
    const rem: Reminder = {
      id: uuid(),
      leader_id: leaderId,
      award_type_id: typeId || null,
      reason: reasonCode,
      message,
      sent_by: senderId,
      sent_at: now,
      created_at: now,
    };

    setData((prev) => ({
      ...prev,
      reminders: [...prev.reminders, rem],
    }));

    const leader = getUser(leaderId);
    if (leader) {
      addEmailLog('REMINDER', leader.email, 'Reminder from HR regarding your award inventory', message, 'reminder', rem.id);
    }
    addAuditLog('REMINDER_SENT', 'reminders', rem.id, null, { manager: getUserName(leaderId), reason: reasonCode }, null);
  };

  const saveAwardType = (type: AwardType) => {
    setData((prev) => {
      const existing = prev.award_types.find((t) => t.id === type.id);
      addAuditLog('RULE_CHANGED', 'award_types', type.id, existing, type, 'Updated by HR Admin');
      return {
        ...prev,
        award_types: prev.award_types.map((t) => (t.id === type.id ? { ...type, updated_at: nowIso() } : t)),
      };
    });
  };

  const addAwardType = (typeData: Omit<AwardType, 'id' | 'created_at' | 'updated_at'>) => {
    const now = nowIso();
    const newType: AwardType = {
      ...typeData,
      id: uuid(),
      created_at: now,
      updated_at: now,
    };
    setData((prev) => {
      addAuditLog('RULE_CHANGED', 'award_types', newType.id, null, newType, 'New award type added');
      return {
        ...prev,
        award_types: [...prev.award_types, newType],
      };
    });
  };

  const saveEligibilityRule = (rule: EligibilityRule) => {
    setData((prev) => {
      const existing = prev.eligibility_rules.find((r) => r.id === rule.id);
      addAuditLog('RULE_CHANGED', 'eligibility_rules', rule.id, existing, rule, 'Updated by HR Admin');
      return {
        ...prev,
        eligibility_rules: prev.eligibility_rules.map((r) => (r.id === rule.id ? { ...rule, updated_at: nowIso() } : r)),
      };
    });
  };

  const saveSetting = (key: string, value: string) => {
    setData((prev) => {
      const existing = prev.settings.find((s) => s.key === key);
      addAuditLog('RULE_CHANGED', 'settings', key, { value: existing?.value }, { value }, 'Updated by HR Admin');
      return {
        ...prev,
        settings: prev.settings.map((s) => (s.key === key ? { ...s, value, updated_at: nowIso() } : s)),
      };
    });
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const tables: (keyof SeedData)[] = [
      'users',
      'eligibility_rules',
      'award_types',
      'settings',
      'leader_inventory',
      'inventory_transactions',
      'awards',
      'point_transactions',
      'redemption_requests',
      'certificates',
      'email_log',
      'reminders',
      'audit_log',
    ];

    for (const name of tables) {
      const rows = (data[name] as unknown as Record<string, unknown>[]).map((item) => {
        const cleanObj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(item)) {
          if (!k.startsWith('_')) {
            cleanObj[k] = v;
          }
        }
        return cleanObj;
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, name);
    }

    const filename = `VCreaTek_RR_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const importFromExcel = (buffer: ArrayBuffer) => {
    try {
      const wb = XLSX.read(buffer, { type: 'array' });
      const tables: (keyof SeedData)[] = [
        'users',
        'eligibility_rules',
        'award_types',
        'settings',
        'leader_inventory',
        'inventory_transactions',
        'awards',
        'point_transactions',
        'redemption_requests',
        'certificates',
        'email_log',
        'reminders',
        'audit_log',
      ];

      const nextData: Record<string, unknown[]> = { ...data };
      let sheetsFound = 0;

      for (const name of tables) {
        if (wb.Sheets[name]) {
          sheetsFound++;
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: null, raw: false });
          nextData[name] = rows.map((r) => {
            const rowClean: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(r)) {
              if (!/\(name\)$/i.test(k.trim())) {
                rowClean[k.trim()] = v === '' ? null : v;
              }
            }
            return rowClean;
          });
        }
      }

      if (sheetsFound === 0) {
        return { error: 'No matching tables found in the uploaded workbook. Expected sheets like users, awards, award_types, etc.' };
      }

      // Cast numeric fields properly
      const numFields = [
        'points',
        'value_rs',
        'per_leader_per_year',
        'needs_approval',
        'gives_certificate',
        'is_active',
        'min_months',
        'exclude_on_notice',
        'is_leadership',
        'points_balance',
        'allocated',
        'used',
        'remaining',
        'quantity',
        'year',
        'voucher_amount',
      ];

      for (const name of tables) {
        if (nextData[name]) {
          nextData[name] = (nextData[name] as Record<string, unknown>[]).map((row) => {
            const normalized = { ...row };
            for (const f of numFields) {
              if (f in normalized && normalized[f] !== null && normalized[f] !== '' && !isNaN(Number(normalized[f]))) {
                normalized[f] = Number(normalized[f]);
              }
            }
            return normalized;
          });
        }
      }

      setData(nextData as unknown as SeedData);
      return { ok: true, loadedCount: sheetsFound };
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error parsing workbook' };
    }
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(INITIAL_SEED_DATA);
  };

  return (
    <DataContext.Provider
      value={{
        data,
        getUser,
        getUserName,
        getAwardType,
        getAwardTypeName,
        getSetting,
        getRupeeRate,
        getUserBalance,
        checkEligibility,
        getLeaderInventory,
        giveAward,
        decideAward,
        revokeAward,
        requestRedemption,
        updateRedemption,
        allocateInventory,
        revokeInventoryUnits,
        sendReminder,
        saveAwardType,
        addAwardType,
        saveEligibilityRule,
        saveSetting,
        exportToExcel,
        importFromExcel,
        resetData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
