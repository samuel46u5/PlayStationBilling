/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { db } from './supabase';

type DaySpec = {
  id?: string;
  day: string;
  startTime: string;
  endTime: string;
};

type PaketDraft = {
  name: string;
  code?: string;
  description?: string;
  status?: string;
  durationHours?: number;
  durationMinutes?: number;
  hargaNormal?: number;
  packagePrice?: number;
  discountAmount?: number;
  selectedConsoles?: string[];
  hariJamList?: DaySpec[];
};

export async function loadConsoles() {
  try {
    const rows = await db.consoles.getAll();
    return (rows || []).map((r: any) => ({ id: r.id, name: r.name }));
  } catch (err) {
    return [];
  }
}

export async function loadPakets() {
  try {
    const rows: any = await db.select('packages', '*');
    if (!rows) return [];
    return (rows as any[]).map((r: any) => ({
      id: r?.id,
      code: r?.code,
      name: r?.name,
      description: r?.description,
      status: r?.status,
      durationHours: r?.duration_hours ?? r?.durationHours ?? 0,
      durationMinutes: r?.duration_minutes ?? r?.durationMinutes ?? 0,
      hargaNormal: r?.harga_normal ?? r?.hargaNormal ?? 0,
      packagePrice: r?.package_price ?? r?.packagePrice ?? undefined,
      discountAmount: r?.discount_amount ?? r?.discountAmount ?? 0,
    }));
  } catch (err) {
    return [];
  }
}

export async function getPackageById(id: string) {
  const pkgRows: any = await db.select('packages', '*', { id });
  const pkg: any = (pkgRows || [])[0];
  if (!pkg) return null;

  const avails = await db.select('package_availabilities', '*', { package_id: id });
  const consoles = await db.select('package_consoles', '*', { package_id: id });

  return {
    id: pkg.id,
    code: pkg.code,
    name: pkg.name,
    description: pkg.description,
    status: pkg.status,
    durationHours: pkg.duration_hours ?? pkg.durationHours ?? 0,
    durationMinutes: pkg.duration_minutes ?? pkg.durationMinutes ?? 0,
    hargaNormal: pkg.harga_normal ?? pkg.hargaNormal ?? 0,
    packagePrice: pkg.package_price ?? pkg.packagePrice ?? undefined,
    discountAmount: pkg.discount_amount ?? pkg.discountAmount ?? 0,
    hariJamList: (avails || []).map((a: any) => ({ id: `hj-${a.id}`, day: a.day, startTime: a.start_time, endTime: a.end_time })),
    selectedConsoles: (consoles || []).map((c: any) => c.console_id),
  };
}

export async function createPackage(draft: PaketDraft) {
  // Ensure we provide an id when the DB schema requires a non-null id without default
  const generatedId = (typeof (globalThis as any).crypto !== 'undefined' && (globalThis as any).crypto.randomUUID)
    ? (globalThis as any).crypto.randomUUID()
    : `pkg-${Date.now()}`;

  const created: any = await db.insert('packages', {
    id: generatedId,
    name: draft.name,
    code: draft.code,
    description: draft.description,
    status: draft.status || 'active',
    duration_hours: draft.durationHours,
    duration_minutes: draft.durationMinutes,
    harga_normal: draft.hargaNormal,
    package_price: draft.packagePrice,
    discount_amount: draft.discountAmount,
  });

  const packageId = created?.id ?? generatedId;

  if (packageId && draft.hariJamList) {
    for (const hj of draft.hariJamList) {
      await db.insert('package_availabilities', { package_id: packageId, day: hj.day, start_time: hj.startTime, end_time: hj.endTime });
    }
  }

  if (packageId && draft.selectedConsoles) {
    for (const cid of draft.selectedConsoles) {
      await db.insert('package_consoles', { package_id: packageId, console_id: cid });
    }
  }

  return created ?? { id: packageId };
}

export async function updatePackage(id: string, draft: PaketDraft) {
  const updated = await db.update('packages', id, {
    name: draft.name,
    code: draft.code,
    description: draft.description,
    status: draft.status,
    duration_hours: draft.durationHours,
    duration_minutes: draft.durationMinutes,
    harga_normal: draft.hargaNormal,
    package_price: draft.packagePrice,
    discount_amount: draft.discountAmount,
  });

  // delete children and re-insert
  try { await (db as any).supabase.from('package_availabilities').delete().eq('package_id', id); } catch (e) { /* ignore */ }
  try { await (db as any).supabase.from('package_consoles').delete().eq('package_id', id); } catch (e) { /* ignore */ }

  if (draft.hariJamList) {
    for (const hj of draft.hariJamList) {
      await db.insert('package_availabilities', { package_id: id, day: hj.day, start_time: hj.startTime, end_time: hj.endTime });
    }
  }

  if (draft.selectedConsoles) {
    for (const cid of draft.selectedConsoles) {
      await db.insert('package_consoles', { package_id: id, console_id: cid });
    }
  }

  return updated;
}

export async function deletePackage(id: string) {
  try { await (db as any).supabase.from('package_availabilities').delete().eq('package_id', id); } catch (e) { /* ignore */ }
  try { await (db as any).supabase.from('package_consoles').delete().eq('package_id', id); } catch (e) { /* ignore */ }
  return await db.delete('packages', id);
}

export default {
  loadConsoles,
  loadPakets,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
};
