const Joi = require('joi');

// Middleware factory: validates req.body against a Joi schema
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join('. ');
    return res.status(400).json({ success: false, message });
  }
  next();
};

// --- Auth Schemas ---
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(7).max(20).optional(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// --- Group Schemas ---
const createGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(300).optional(),
  contributionAmount: Joi.number().positive().required(),
  currency: Joi.string().valid('NGN', 'GBP', 'USD', 'EUR', 'GHS', 'KES').default('NGN'),
  frequency: Joi.string().valid('weekly', 'biweekly', 'monthly').required(),
  totalMembers: Joi.number().integer().min(2).max(100).required(),
  startDate: Joi.date().iso().required(),
});

const updateGroupSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().max(300),
  status: Joi.string().valid('draft', 'active', 'completed', 'paused'),
}).min(1);

// --- Member Schemas ---
const addMemberSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().min(7).max(20).optional(),
  email: Joi.string().email().optional(),
  turnOrder: Joi.number().integer().min(1).optional(), // auto-assigned if not provided
  notes: Joi.string().max(300).optional(),
  joinedMidCycle: Joi.boolean().default(false),
});

const updateTurnSchema = Joi.object({
  turnOrder: Joi.number().integer().min(1).required(),
});

// --- Payment Schemas ---
const recordPaymentSchema = Joi.object({
  groupId: Joi.string().required(),
  memberId: Joi.string().required(),
  cycle: Joi.number().integer().min(1).required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('contribution', 'adjustment').default('contribution'),
  method: Joi.string().valid('cash', 'bank_transfer', 'mobile_money', 'other').default('cash'),
  reference: Joi.string().max(100).optional(),
  notes: Joi.string().max(300).optional(),
  paidAt: Joi.date().iso().optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  updateTurnSchema,
  recordPaymentSchema,
};
