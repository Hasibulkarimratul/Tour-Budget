/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Member, type Expense, type MemberBalance, type Transaction } from '@/src/types';

export function calculateBalances(members: Member[], expenses: Expense[]): MemberBalance[] {
  const balancesMap: { [id: string]: { paid: number; share: number } } = {};

  members.forEach((m) => {
    balancesMap[m.id] = { paid: 0, share: 0 };
  });

  expenses.forEach((exp) => {
    // Add to total paid
    Object.entries(exp.payers).forEach(([memberId, amount]) => {
      if (balancesMap[memberId]) {
        balancesMap[memberId].paid += Number(amount);
      }
    });

    // Add to total share
    Object.entries(exp.beneficiaries).forEach(([memberId, amount]) => {
      if (balancesMap[memberId]) {
        balancesMap[memberId].share += Number(amount);
      }
    });
  });

  return members.map((member) => ({
    member,
    totalPaid: Number(balancesMap[member.id].paid.toFixed(2)),
    totalShare: Number(balancesMap[member.id].share.toFixed(2)),
    netBalance: Number((balancesMap[member.id].paid - balancesMap[member.id].share).toFixed(2)),
  }));
}

export function simplifyDebts(balances: MemberBalance[]): Transaction[] {
  const transactions: Transaction[] = [];
  
  // Use a map to handle net amounts to avoid precision errors during calculation
  let netAmounts = balances.map(b => ({
    id: b.member.id,
    net: b.netBalance
  })).filter(b => Math.abs(b.net) > 0.01);

  // Separate into debtors and creditors
  let debtors = netAmounts.filter(a => a.net < 0).sort((a, b) => a.net - b.net); // Most negative first
  let creditors = netAmounts.filter(a => a.net > 0).sort((a, b) => b.net - a.net); // Most positive first

  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debt = Math.abs(debtors[d].net);
    const credit = creditors[c].net;
    const settleAmount = Math.min(debt, credit);

    if (settleAmount > 0.01) {
      transactions.push({
        from: debtors[d].id,
        to: creditors[c].id,
        amount: Number(settleAmount.toFixed(2))
      });
    }

    debtors[d].net += settleAmount;
    creditors[c].net -= settleAmount;

    if (Math.abs(debtors[d].net) < 0.01) d++;
    if (Math.abs(creditors[c].net) < 0.01) c++;
  }

  return transactions;
}

export function generateCSV(balances: MemberBalance[], settlements: Transaction[]): string {
  let csv = "Member Name,Phone,Total Paid,Total Share,Net Balance\n";
  balances.forEach((b) => {
    csv += `"${b.member.name}","${b.member.phoneNumber}",${b.totalPaid.toFixed(2)},${b.totalShare.toFixed(2)},${b.netBalance.toFixed(2)}\n`;
  });

  csv += "\nPAYMENT PLAN (Simplify Debts)\n";
  csv += "From,To,Amount\n";
  settlements.forEach((s) => {
    const fromName = balances.find(b => b.member.id === s.from)?.member.name || s.from;
    const toName = balances.find(b => b.member.id === s.to)?.member.name || s.to;
    csv += `"${fromName}","${toName}",${s.amount.toFixed(2)}\n`;
  });

  return csv;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
