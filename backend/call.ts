import express from 'express';
import type { Request, Response } from 'express';
import twilio from 'twilio';
const router = express.Router();

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

const recentCalls = [
      { id: '1', name: "Uvindu", type: "Outgoing", time: "Yesterday", count: null, isMissed: false, avatarURI: "https://i.pravatar.cc/100?img=11", appUserId: "user_uvindu" },
      { id: '2', name: "Sasindu", type: "Outgoing", time: "Yesterday", count: 3, isMissed: false, avatarURI: "https://i.pravatar.cc/100?img=12", appUserId: "user_sasindu" },
];

router.get('/', (req: Request, res: Response) => {
    res.json({ success: true, calls: recentCalls });
});

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

        const token =  new AccessToken(
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
router.post('/make-call', express.urlencoded({extended: false}), (req: Request, res: Response) => {
    const {to} = req.body;
    const response = new twilio.twiml.VoiceResponse();

    if(to) {
        const dial = response.dial();
        dial.client(to);
    } else {
        response.say("Thanks for calling MeChat!");
    }
    res.type('text/xml');
    res.send(response.toString());
});
export default router;