const Broker = require('../models/Broker');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const normalizeWhatsapp = (num) => {
    let clean = num.replace(/\D/g, '');
    if (clean.length === 10) clean = '91' + clean;
    return clean;
};

exports.register = async (req, res) => {
    try {
        const { name, company, email, password, whatsappNumber } = req.body;
        const normalizedNumber = normalizeWhatsapp(whatsappNumber);
        
        const existing = await Broker.findOne({ $or: [{ email }, { whatsappNumber: normalizedNumber }] });
        if (existing) return res.status(400).json({ error: 'Email or WhatsApp already registered' });
        
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const broker = new Broker({ name, company, email, passwordHash, whatsappNumber: normalizedNumber });
        await broker.save();
        
        res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const broker = await Broker.findOne({ email });
        if (!broker) return res.status(400).json({ error: 'Invalid credentials' });
        
        const validPassword = await bcrypt.compare(password, broker.passwordHash);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: broker._id, role: broker.role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '7d' });
        res.json({ token, user: { id: broker._id, name: broker.name, company: broker.company, email: broker.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const broker = await Broker.findById(req.user.id).select('-passwordHash');
        if (!broker) return res.status(404).json({ error: 'Broker not found' });
        res.json(broker);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};