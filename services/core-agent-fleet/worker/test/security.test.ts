import { describe, expect, it } from "vitest";
import { authorized, constantTimeEqual, parseChatInput, redactForStorage } from "../src/security";

describe("fleet authorization", () => {
  it("fails closed when the secret is missing or the bearer token differs", () => {
    expect(authorized(new Request("https://fleet.test/v1/fleet/status"), undefined)).toBe(false);
    expect(authorized(new Request("https://fleet.test/v1/fleet/status"), "secret")).toBe(false);
    expect(authorized(new Request("https://fleet.test/v1/fleet/status", { headers: { authorization: "Bearer wrong" } }), "secret")).toBe(false);
  });

  it("accepts only the exact bearer token", () => {
    const request = new Request("https://fleet.test/v1/fleet/status", { headers: { authorization: "Bearer secret" } });
    expect(authorized(request, "secret")).toBe(true);
    expect(constantTimeEqual("secret", "secret")).toBe(true);
    expect(constantTimeEqual("secret", "secreu")).toBe(false);
  });
});
describe("chat input", () => {
  it("accepts a bounded message and rejects an empty one", async () => {
    const input = await parseChatInput(new Request("https://fleet.test", { method: "POST", body: JSON.stringify({ message: "  hello  " }) }));
    expect(input.message).toBe("hello");
    await expect(parseChatInput(new Request("https://fleet.test", { method: "POST", body: JSON.stringify({ message: "" }) }))).rejects.toThrow();
  });

  it("redacts common contact and credential shapes before persistence", () => {
    const result = redactForStorage("Email person@example.com or +1 409 555 1212. Bearer abcdefghijklmnop");
    expect(result).not.toContain("person@example.com");
    expect(result).not.toContain("409 555 1212");
    expect(result).not.toContain("abcdefghijklmnop");
  });
});
