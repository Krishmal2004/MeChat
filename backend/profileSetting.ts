import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from './db.js';

const router = Router();

router.get('/user/profile', async (req: Request, res: Response): Promise<void> => {
    const phone = req.query.phone as string;
    
    if (!phone) {
        res.status(400).json({ success: false, error: 'Phone number is required' });
        return;
    }
    try {
        const user = await prisma.user.findUnique({
            where: { phone: phone }
        });
        if (user) {
            res.status(200).json({ success: true, user });
        } else {
            res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.put('/user/profile', async (req: Request, res: Response): Promise<void> => {
    const phone = req.query.phone as string;
    const { displayName, bio } = req.body;

    if (!phone) {
        res.status(400).json({ success: false, error: 'Phone number is required' });
        return;
    }

    try {
        const user = await prisma.user.update({
            where: { phone: phone },
            data: { displayName, bio }
        });
        res.status(200).json({ success: true, user });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.delete('/user/account', async (req: Request, res: Response): Promise<void> => {
    const phone = req.query.phone as string;
    if (!phone) {
        res.status(400).json({ success: false, error: 'Phone number is required' });
        return;
    }
    try {
        await prisma.user.delete({
            where: { phone: phone }
        });
        res.status(200).json({ success: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;