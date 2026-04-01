import express from 'express';
import type { Request, Response } from 'express';
import { prisma } from './db.js';
const router = express.Router();

router.post('/send', async (req: Request, res: Response): Promise<void> => {
    const { senderPhone, receiverPhone, content } = req.body;
    if (!senderPhone || !receiverPhone || !content) {
        res.status(400).json({ success: false, error: 'Missing required fields' });
        return;
    }
    try {
        const receiver = await prisma.user.findUnique({
            where: { phone: receiverPhone }
        });
        if (!receiver) {
            res.status(404).json({ success: false, error: 'User is not registered on MeChat' });
            return;
        }
        const message = await prisma.message.create({
            data: {
                content,
                senderPhone,
                receiverPhone
            }
        });
        res.status(200).json({ success: true, message });
    } catch (error: any) {
        console.error("Send Message Error: ", error);
        res.status(500).json({ success: false, error: error.message || 'Failed to send message' });
    }
});

router.get('/chats/:phone', async (req: Request, res: Response): Promise<void> => {
    const { phone } = req.params;
    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderPhone: phone },
                    { receiverPhone: phone }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: true,
                receiver: true
            }
        });
        const chatsMap = new Map();
        messages.forEach(msg => {
            const isMeSender = msg.senderPhone === phone;
            const partner = isMeSender ? msg.receiver : msg.sender;
            const partnerPhone = partner.phone;
            if (!chatsMap.has(partnerPhone)) {
                const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                chatsMap.set(partnerPhone, {
                    id: partnerPhone,
                    name: partner.displayName || partner.phone,
                    lastMessage: msg.content,
                    time: timeStr,
                    avatarInitial: (partner.displayName || partner.phone).charAt(0).toUpperCase(),
                    avatarColor: partner.avatarColor || '#128C7E',
                    isRead: msg.isRead,
                    isGroup: false,
                    unread: (!isMeSender && !msg.isRead) ? 1 : 0
                });
            } else {
                if (!isMeSender && !msg.isRead) {
                    const existingChat = chatsMap.get(partnerPhone);
                    existingChat.unread += 1;
                }
            }
        });
        const chats = Array.from(chatsMap.values());
        res.status(200).json({ success: true, chats });

    } catch (error: any) {
        console.error("Fetch Chats Error: ", error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch chats' });
    }
});

// Get chat in screen
router.get('/:sender/:receiver', async (req: Request, res: Response): Promise<void> => {
    const { sender, receiver } = req.params;
    try {
        // --- FIX: Mark messages as read when the chat is opened ---
        await prisma.message.updateMany({
            where: {
                senderPhone: receiver,
                receiverPhone: sender,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderPhone: sender, receiverPhone: receiver },
                    { senderPhone: receiver, receiverPhone: sender }
                ]
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        res.status(200).json({ success: true, messages });
    } catch (error: any) {
        console.error("Fetch Messages Error: ", error);
        res.status(500).json({ success: false, error: error.message || 'Failed to fetch messages' });
    }
});
export default router;