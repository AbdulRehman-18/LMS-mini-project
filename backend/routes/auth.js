// routes/auth.js
const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Check if user exists
        const user = await Member.findByEmailWithPassword(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password (simple string comparison for this demo)
        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check if member is active
        if (user.membership_status !== 'Active') {
            return res.status(401).json({ message: 'Account is not active. Please contact the library.' });
        }

        // Remove password from response
        const { password: userPassword, ...userWithoutPassword } = user;

        res.json({
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed. Please try again.' });
    }
});

// Register endpoint
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, address, membershipType, password } = req.body;
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        // Check if email already exists
        const existingMember = await Member.findByEmail(email);
        if (existingMember) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create new member
        const memberId = await Member.createWithPassword({
            name,
            phone,
            email,
            address,
            membershipType: membershipType || 'Standard',
            password: password || 'password123',
            membership_date: new Date(),
            membership_status: 'Active'
        });

        res.status(201).json({ 
            id: memberId, 
            message: 'Account created successfully. You can now login.' 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
});

// Check auth status (for protected routes)
router.get('/status', async (req, res) => {
    res.json({ message: 'Auth endpoints are working' });
});

module.exports = router;
