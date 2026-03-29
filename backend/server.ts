import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import twilio from 'twilio';
import { PrismaClient } from '@prisma/client'; 
import { PrismaPg } from '@prisma/adapter-pg'; 
import pg from 'pg';                          
import dotenv from 'dotenv';

dotenv.config();

const app = express();

//Prisma adapter for PostgreSQL
const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({adapter});

app.use(express.json());
app.use(cors());

// Twilio configuration
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

// Send OTP route 
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
    const { phone } = req.body;
    try {
        const verification = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verifications.create({ to: phone, channel: 'sms' });

        res.status(200).json({
            success: true,
            status: verification.status
        });
    } catch (error: any) { 
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
//Verify OTP
app.post('/api/auth/verify-otp', async (req: Request, res: Response): Promise<void> => {
    const { phone, code } = req.body;
    try {
        const verificationCheck = await twilioClient.verify.v2
            .services(verifyServiceSid)
            .verificationChecks.create({ to: phone, code });

        if (verificationCheck.status === 'approved') {
            const existingUser = await prisma.user.findUnique({ where: { phone } });
            
            res.status(200).json({ 
                success: true, 
                isNewUser: !existingUser,
                user: existingUser
            });
        } else {
            res.status(400).json({ success: false, error: 'Invalid OTP code' });
        }
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});
//Profile setup route
app.post('/api/user/setup-profile', async (req: Request, res: Response): Promise<void> => {
    const { phone, displayName, bio, avatarColor, avatarUrl } = req.body;
    
    try {
        const user = await prisma.user.upsert({
            where: { phone },
            update: {
                displayName,
                bio,
                avatarColor,
                avatarUrl
            },
            create: {
                phone,
                displayName,
                bio,
                avatarColor,
                avatarUrl
            }
        });

        res.status(200).json({
            success: true,
            user
        });
    } catch (error: any) {
        console.error("Profile Setup Error: ", error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save profile'
        });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});