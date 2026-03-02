import { CustomMessage, Recurrence } from "../../../models/custom_message";

describe("CustomMessage", () => {
  it("should be able to create a new instance", () => {
    const message = new CustomMessage({ date: "2026-03-01", message: "Test Message", recurrence: Recurrence.None });
    expect(message).toEqual({ date: "2026-03-01", message: "Test Message", recurrence: Recurrence.None });
  });

  it("should be able to update an existing instance", () => {
    const message = new CustomMessage({ date: "2026-03-01", message: "Old Message", recurrence: Recurrence.None });
    const updatedMessage = { date: "2026-03-01", message: "Updated Message", recurrence: Recurrence.Yearly };

    message.update(updatedMessage);

    expect(message).toEqual(updatedMessage);
  });

  it("should be able to delete an instance", () => {
    const message = new CustomMessage({ date: "2026-03-01", message: "Message to Delete", recurrence: Recurrence.None });

    message.delete();

    expect(message).toEqual({ date: undefined, message: "", recurrence: Recurrence.None });
  });
});