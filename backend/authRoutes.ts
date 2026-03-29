import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.post('/auth/logout',async (req: Request, res:Response): Promise<void> => {
    try {
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});
export default router;