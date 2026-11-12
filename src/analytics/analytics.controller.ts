import {Request, Response} from "express";
import {AnalyticsService} from "./analytics.service";

export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    getAdminDashboard = async (req: Request, res: Response): Promise<void> => {
        try {
            const from = typeof req.query.from === "string" ? req.query.from : "";
            const to = typeof req.query.to === "string" ? req.query.to : "";
            const data = await this.analyticsService.getDashboard(from, to);
            res.status(200).json({success: true, data});
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to retrieve dashboard analytics";
            if (/Invalid date|Invalid date range|366 days/.test(message)) {
                res.status(400).json({success: false, message});
                return;
            }
            res.status(500).json({success: false, message: "Unable to retrieve dashboard analytics"});
        }
    };
}
