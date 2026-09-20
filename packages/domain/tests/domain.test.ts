import { describe, expect, it } from "vitest";
import {
  assertSharesConserveTotal,
  nextAssignee,
  splitEqual,
  yuanToCents,
} from "../src/index";

describe("费用金额", () => {
  it("四人均分 31.90 元时整数分守恒", () => {
    const shares = splitEqual(3190, ["lin", "zhou", "xu", "zhe"]);
    expect(shares.map((item) => item.amountCents)).toEqual([798, 798, 797, 797]);
    expect(() => assertSharesConserveTotal(3190, shares)).not.toThrow();
  });

  it("人民币输入转换为整数分", () => {
    expect(yuanToCents("38.6")).toBe(3860);
    expect(() => yuanToCents("12.345")).toThrow();
  });
});

describe("家务轮值", () => {
  it("完成后轮换到下一位成员", () => {
    expect(nextAssignee("zhou", ["lin", "zhou", "xu", "zhe"])).toBe("xu");
  });
});
