import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from './db.js'; 
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Create uploads folder if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 1. Upload a new status (with file)
router.post('/upload', upload.single('media'), async (req: Request, res: Response): Promise<void> => {
    const { phone, content } = req.body;
    const file = req.file;

    if (!phone || (!file && !content)) {
        res.status(400).json({ success: false, error: 'Phone and media/content are required' });
        return;
    }

    try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        // Construct the URL to access the uploaded file
        const mediaUrl = file ? `http://10.0.2.2:3000/uploads/${file.filename}` : null;

        const newStatus = await prisma.status.create({
            data: {
                authorPhone: phone,
                mediaUrl: mediaUrl,
                content: content || null,
                expiresAt
            }
        });

        res.status(201).json({ success: true, status: newStatus });
    } catch (error: any) {
        console.error("Status Upload Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Fetch active statuses
router.get('/:phone', async (req: Request, res: Response): Promise<void> => {
    const { phone } = req.params;

    try {
        const now = new Date();

        const myStatuses = await prisma.status.findMany({
            where: {
                authorPhone: phone,
                expiresAt: { gt: now }
            },
            orderBy: { createdAt: 'asc' }
        });

        const contactsWithStatuses = await prisma.user.findMany({
            where: {
                phone: { not: phone },
                statuses: {
                    some: { expiresAt: { gt: now } }
                }
            },
            select: {
                phone: true,
                displayName: true,
                avatarUrl: true,
                avatarColor: true,
                statuses: {
                    where: { expiresAt: { gt: now } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        const formattedContacts = contactsWithStatuses.map(user => ({
            phone: user.phone,
            name: user.displayName || user.phone,
            avatarURI: user.avatarUrl,
            statuses: user.statuses,
            latestUpdate: user.statuses[user.statuses.length - 1].createdAt
        }));

        formattedContacts.sort((a, b) => 
            new Date(b.latestUpdate).getTime() - new Date(a.latestUpdate).getTime()
        );

        res.status(200).json({ 
            success: true, 
            myStatuses, 
            contactsStatuses: formattedContacts 
        });
    } catch (error: any) {
        console.error("Fetch Statuses Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;