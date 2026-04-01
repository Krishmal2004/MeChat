import express from 'express';
import type { Request, Response } from 'express';
import twilio from 'twilio';
import { prisma } from './db.js'; 
const router = express.Router();

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

router.get('/token', (req: Request, res: Response) => {
    try {
        const identity = (req.query.identity as string) || 'user_me';
        const platform = req.query.platform as string;
        const pushCredentialSid = platform === 'ios'
            ? process.env.TWILIO_PUSH_CREDENTIAL_SID_IOS
            : process.env.TWILIO_PUSH_CREDENTIAL_SID_ANDROID;
            
        const voiceGrant = new VoiceGrant({
            outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID || '',
            incomingAllow: true, 
            pushCredentialSid: pushCredentialSid || ''
        });

        const token = new AccessToken(
            process.env.TWILIO_ACCOUNT_SID!,
            process.env.TWILIO_API_KEY_SID!,
            process.env.TWILIO_API_KEY_SECRET!,
            { identity }
        );
        token.addGrant(voiceGrant);
        res.json({
            success: true,
            token: token.toJwt(),
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

//Make Call Route
router.post('/make-call', express.urlencoded({ extended: false }), (req: Request, res: Response) => {
    const { to } = req.body;
    const response = new twilio.twiml.VoiceResponse();

    if (to) {
        const dial = response.dial();
        dial.client(to);
    } else {
        response.say("Thanks for calling MeChat!");
    }
    res.type('text/xml');
    res.send(response.toString());
});

//Log a finished call
router.post('/log', async (req: Request, res: Response) => {
    try {
        const { callerPhone, receiverPhone, status, duration } = req.body;

        // FIX: Ensure both users exist in the DB to prevent Foreign Key constraint errors
        if (callerPhone) {
            await prisma.user.upsert({
                where: { phone: callerPhone },
                update: {},
                create: { phone: callerPhone, displayName: 'Unknown Contact' }
            });
        }
        
        if (receiverPhone) {
            await prisma.user.upsert({
                where: { phone: receiverPhone },
                update: {},
                create: { phone: receiverPhone, displayName: 'Unknown Contact' }
            });
        }

        const newLog = await prisma.callLog.create({
            data: {
                callerPhone,
                receiverPhone,
                status: status || 'completed',
                duration: duration || 0
            }
        });

        res.json({ success: true, log: newLog });
    } catch (error: any) {
        console.error("Save call log error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//Fetch Call History
router.get('/:phone', async (req: Request, res: Response) => {
    try {
        const { phone } = req.params;
        const logs = await prisma.callLog.findMany({
            where: {
                OR: [{ callerPhone: phone }, { receiverPhone: phone }]
            },
            include: {
                caller: true,
                receiver: true,
            },
            orderBy: { 
                createdAt: 'desc',
            },
            take: 50
        });
        
        const formattedCalls = logs.map(log => {
            const isOutgoing = log.callerPhone === phone;
            const otherUser = isOutgoing ? log.receiver : log.caller;
            return {
                id: log.id.toString(),
                name: otherUser?.displayName || otherUser?.phone || 'Unknown', 
                type: isOutgoing ? 'Outgoing' : 'Incoming',
                time: log.createdAt.toISOString(),
                count: null,
                isMissed: log.status === 'missed',
                avatarURI: otherUser?.avatarUrl || null,
                appUserId: otherUser?.phone
            };
        });
        res.json({ success: true, calls: formattedCalls });
    } catch (error: any) {
        console.error('Error fetching call logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;