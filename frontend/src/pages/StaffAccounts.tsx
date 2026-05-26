import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../services/firebase.ts';
import { UserProfile, UserRole } from '../types.ts';
import { Users, ShieldCheck, Mail, Calendar, Loader2, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export default function StaffAccounts() {
  const { isAdmin, isSandboxMode } = useAuth();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStaffProfiles = async () => {
    setLoading(true);
    if (isSandboxMode) {
      const cachedUsers = localStorage.getItem('tecno_sandbox_users');
      let usersList: UserProfile[] = [];
      if (cachedUsers) {
        try {
          usersList = JSON.parse(cachedUsers);
        } catch (_) {}
      } else {
        usersList = [
          { uid: 'sandbox-admin-uid', email: 'admin@tecno.com', displayName: 'Demo Administrator', role: 'admin', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() },
          { uid: 'sandbox-staff-1', email: 'sam@tecno.com', displayName: 'Sam Inventory Officer', role: 'staff', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() },
          { uid: 'sandbox-staff-2', email: 'lisa@tecno.com', displayName: 'Lisa Logistics Specialist', role: 'staff', createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() }
        ];
        localStorage.setItem('tecno_sandbox_users', JSON.stringify(usersList));
      }
      setProfiles(usersList);
      setLoading(false);
      return;
    }

    try {
      let usersSnap;
      try {
        usersSnap = await getDocs(collection(db, 'users'));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users');
      }
      const list: UserProfile[] = [];
      if (usersSnap) {
        usersSnap.forEach(d => {
          list.push({ id: d.id, ...d.data() } as any);
        });
      }
      setProfiles(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffProfiles();
  }, [isSandboxMode]);

  const handleRoleToggle = async (profile: UserProfile) => {
    if (!isAdmin) return;
    const nextRole: UserRole = profile.role === 'admin' ? 'staff' : 'admin';
    
    setUpdatingId(profile.uid);
    if (isSandboxMode) {
      const updatedProfiles = profiles.map(p => p.uid === profile.uid ? { ...p, role: nextRole } : p);
      setProfiles(updatedProfiles);
      localStorage.setItem('tecno_sandbox_users', JSON.stringify(updatedProfiles));
      setUpdatingId(null);
      return;
    }

    try {
      try {
        await updateDoc(doc(db, 'users', profile.uid), {
          role: nextRole
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${profile.uid}`);
      }
      setProfiles(prev => prev.map(p => p.uid === profile.uid ? { ...p, role: nextRole } : p));
    } catch (err) {
      console.error(err);
      alert("Unauthorized: Firestore rules prevent role manipulation unless strictly performed by an Admin.");
    } finally {
      setUpdatingId(null);
    }
  };

  const parseTimestamp = (ts: any) => {
    if (!ts) return 'N/A';
    if (ts.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden" id="staff-accounts-view">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 select-none">
        <div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Authorized Team Members</span>
          <p className="text-xs text-slate-400 font-medium">Manage corporate access permissions and system oversight</p>
        </div>
        <Users size={18} className="text-slate-400" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader2 className="animate-spin text-teal-500" size={18} />
          <span className="text-xs text-slate-450 font-semibold uppercase tracking-wider">Syncing staff ledger...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="staff-accounts-table">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 text-[10px] font-bold text-slate-400 dark:text-slate-505 uppercase tracking-widest select-none">
                <th className="px-6 py-4">Employee Name</th>
                <th className="px-6 py-4">Authorized Email</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Role Promotion</th>
                <th className="px-6 py-4 text-right">Last Portal Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[13px] text-slate-600 dark:text-slate-350">
              {profiles.map((prof) => (
                <tr key={prof.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors" id={`staff-row-${prof.uid}`}>
                  <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                    {prof.displayName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400" />
                      <span className="select-all">{prof.email}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 select-none">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                      prof.role === 'admin' 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' 
                      : 'bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400'
                    }`}>
                      <Award size={10} />
                      {prof.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 select-none">
                    <button
                      disabled={!isAdmin || updatingId !== null}
                      onClick={() => handleRoleToggle(prof)}
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        isAdmin 
                        ? 'border-slate-200 dark:border-slate-705 text-slate-700 dark:text-slate-300 hover:border-teal-400 hover:text-teal-400 bg-white dark:bg-slate-800 hover:scale-[1.01]' 
                        : 'border-slate-100 text-slate-300 cursor-not-allowed opacity-30 bg-slate-50'
                      }`}
                      id={`toggle-role-${prof.uid}`}
                    >
                      {updatingId === prof.uid ? <Loader2 size={11} className="animate-spin text-teal-500" /> : <ShieldCheck size={11} />}
                      <span>Toggle Admin Access</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-semibold text-slate-400 dark:text-slate-505 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <Calendar size={12} />
                      <span>{parseTimestamp(prof.lastLogin)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
