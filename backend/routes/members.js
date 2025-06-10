// routes/members.js
const express = require('express');
const router = express.Router();
const Member = require('../models/Member');

// Get all members
router.get('/', async (req, res) => {
    try {
        const members = await Member.findAll();
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search members
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }
        const members = await Member.search(q);
        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single member
router.get('/:id', async (req, res) => {
    try {
        const member = await Member.findById(req.params.id);
        if (member) {
            res.json(member);
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new member
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if email already exists
        const existingMember = await Member.findByEmail(email);
        if (existingMember) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const memberId = await Member.create({
            name,
            phone,
            email,
            address,
            membership_date: new Date(),
            membership_status: 'Active'
        });

        res.status(201).json({ id: memberId, message: 'Member created successfully' });
        console.log("member added to database!");
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update a member
router.put('/:id', async (req, res) => {
    try {
        const { name, phone, email, address, membership_status } = req.body;
        
        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if email already exists for different member
        const existingMember = await Member.findByEmail(email);
        if (existingMember && existingMember.id !== parseInt(req.params.id)) {
            return res.status(400).json({ message: 'Email already registered to another member' });
        }

        const success = await Member.update(req.params.id, {
            name,
            phone,
            email,
            address,
            membership_status
        });

        if (success) {
            res.json({ message: 'Member updated successfully' });
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a member
router.delete('/:id', async (req, res) => {
    try {
        const success = await Member.delete(req.params.id);
        if (success) {
            res.json({ message: 'Member deleted successfully' });
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update member status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status || !['Active', 'Expired', 'Suspended'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }

        const success = await Member.updateMembershipStatus(req.params.id, status);
        if (success) {
            res.json({ message: 'Member status updated successfully' });
        } else {
            res.status(404).json({ message: 'Member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
