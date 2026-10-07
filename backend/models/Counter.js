import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

/** Atomic, gap-tolerant sequence generator (used for order numbers). */
export async function nextSequence(name, start = 1000) {
  try {
    await Counter.updateOne({ _id: name }, { $setOnInsert: { seq: start } }, { upsert: true });
  } catch (err) {
    if (err.code !== 11000) throw err; // concurrent first insert - already exists, fine
  }
  const doc = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { returnDocument: 'after' });
  return doc.seq;
}

export default Counter;
