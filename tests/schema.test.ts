import { describe, expect, it } from "vitest";
import { ItemStatus } from "@/generated/prisma/enums";

describe("schema enums", () => {
  it("defines the four kanban columns", () => {
    expect(Object.values(ItemStatus)).toEqual(["TODO", "IN_PROGRESS", "REVIEW", "DONE"]);
  });
});
