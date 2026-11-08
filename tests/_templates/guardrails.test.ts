/**
 * Guardrail test templates. Copy per feature and fill in the TODOs.
 * These catch the failures AI code makes most often and you never see when testing alone:
 *   1. data leaks across users/scopes   2. lost updates & duplicates under concurrency
 *   3. double submits                   4. N+1 queries
 * Written for Vitest/Jest + Supertest; adapt the helpers to your stack.
 */
import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../src/app"; // TODO: your app entry
// TODO: implement these helpers once in tests/helpers.ts
import { loginAs, createRecordFor, countQueries, db } from "../helpers";

const ENDPOINT = "/api/vouchers"; // TODO: the feature's endpoint

describe("security: authentication and scope", () => {
  it("rejects anonymous access", async () => {
    const res = await request(app).get(ENDPOINT);
    expect(res.status).toBe(401);
  });

  it("does not let a user read another scope's record by changing the id", async () => {
    const other = await createRecordFor({ branch: "B" });
    const token = await loginAs({ role: "clerk", branch: "A" });
    const res = await request(app).get(`${ENDPOINT}/${other.id}`).set("Authorization", `Bearer ${token}`);
    expect([403, 404]).toContain(res.status);
  });

  it("does not let a low-privilege role perform a privileged action", async () => {
    const token = await loginAs({ role: "clerk", branch: "A" });
    const rec = await createRecordFor({ branch: "A" });
    const res = await request(app).post(`${ENDPOINT}/${rec.id}/approve`).set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});

describe("concurrency", () => {
  it("produces unique sequence numbers under 20 parallel creates", async () => {
    const token = await loginAs({ role: "accountant", branch: "A" });
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        request(app).post(ENDPOINT).set("Authorization", `Bearer ${token}`).send({ /* TODO valid body */ }),
      ),
    );
    const numbers = results.filter((r) => r.status === 201).map((r) => r.body.number);
    expect(numbers.length).toBe(20);
    expect(new Set(numbers).size).toBe(20);
  });

  it("does not lose updates when two requests change the same record", async () => {
    // TODO: e.g. two parallel +500 adjustments to a balance of 1000 must end at 2000
  });

  it("creates only one record when the same idempotency key is sent twice", async () => {
    const token = await loginAs({ role: "accountant", branch: "A" });
    const send = () =>
      request(app).post(ENDPOINT).set("Authorization", `Bearer ${token}`)
        .set("Idempotency-Key", "test-key-1").send({ /* TODO valid body */ });
    const [a, b] = await Promise.all([send(), send()]);
    expect(a.body.id).toBe(b.body.id);
  });
});

describe("performance", () => {
  it("lists records with a constant number of queries (no N+1)", async () => {
    const token = await loginAs({ role: "accountant", branch: "A" });
    for (let i = 0; i < 50; i++) await createRecordFor({ branch: "A" });
    const queries = await countQueries(() =>
      request(app).get(`${ENDPOINT}?page=1`).set("Authorization", `Bearer ${token}`),
    );
    expect(queries).toBeLessThanOrEqual(3); // TODO: set the expected count
  });

  it("caps page size", async () => {
    const token = await loginAs({ role: "accountant", branch: "A" });
    const res = await request(app).get(`${ENDPOINT}?pageSize=100000`).set("Authorization", `Bearer ${token}`);
    expect(res.body.items.length).toBeLessThanOrEqual(100);
  });
});

describe("data integrity", () => {
  it("rolls back fully when a multi-step write fails halfway", async () => {
    // TODO: force the second step to fail (e.g. invalid line) and assert no partial rows exist
    void db;
  });
});
