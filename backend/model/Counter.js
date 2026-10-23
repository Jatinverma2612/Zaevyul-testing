import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema(
  {
    counterName: { type: String, required: true, unique: true },
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Counter = mongoose.model("Counter", CounterSchema);

/**
 * Get next sequence number atomically for a counter name.
 * Prevents race conditions and duplicate invoice numbers under concurrency.
 */
export const getNextSequence = async (counterName) => {
  const result = await Counter.findOneAndUpdate(
    { counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return result.seq;
};

export default Counter;
