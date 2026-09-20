export type Member = {
  id: string;
  name: string;
  color: string;
};

export type ExpenseShare = {
  memberId: string;
  amountCents: number;
};

export function yuanToCents(value: string | number): number {
  const normalized = typeof value === "number" ? value.toFixed(2) : value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("金额最多保留两位小数");
  }
  const [yuan, decimal = ""] = normalized.split(".");
  return Number(yuan) * 100 + Number(decimal.padEnd(2, "0"));
}

export function formatYuan(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

export function splitEqual(totalCents: number, memberIds: string[]): ExpenseShare[] {
  if (!Number.isInteger(totalCents) || totalCents <= 0) {
    throw new Error("费用金额必须是正整数分");
  }
  if (memberIds.length === 0) {
    throw new Error("至少选择一位参与人");
  }

  const base = Math.floor(totalCents / memberIds.length);
  const remainder = totalCents % memberIds.length;
  return memberIds.map((memberId, index) => ({
    memberId,
    amountCents: base + (index < remainder ? 1 : 0),
  }));
}

export function assertSharesConserveTotal(totalCents: number, shares: ExpenseShare[]): void {
  const sum = shares.reduce((current, share) => current + share.amountCents, 0);
  if (sum !== totalCents) {
    throw new Error(`分摊合计 ${sum} 分与费用 ${totalCents} 分不一致`);
  }
}

export function nextAssignee(currentMemberId: string, rotation: string[]): string {
  if (rotation.length === 0) throw new Error("轮值成员不能为空");
  const currentIndex = rotation.indexOf(currentMemberId);
  return rotation[(currentIndex < 0 ? 0 : currentIndex + 1) % rotation.length];
}
