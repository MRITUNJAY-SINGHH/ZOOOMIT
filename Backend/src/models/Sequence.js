import mongoose from 'mongoose';

const sequenceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 }
});

sequenceSchema.statics.getNextValue = async function(sequenceName, session = null) {
  const options = { new: true, upsert: true };
  if (session) options.session = session;

  const sequenceDocument = await this.findOneAndUpdate(
    { name: sequenceName },
    { $inc: { value: 1 } },
    options
  );
  return sequenceDocument.value;
};

export default mongoose.model('Sequence', sequenceSchema);
