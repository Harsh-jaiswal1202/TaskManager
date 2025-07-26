import mongoose from 'mongoose';

const surveyResponseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  answers: {
    type: [Number],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('SurveyResponse', surveyResponseSchema); 