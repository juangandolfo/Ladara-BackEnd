import {Request, Response} from "express";
import {User} from "../user/user.entity";
import {BillingInformationService} from "./billing-information.service";
import {BillingInformation,} from "./billing-information.entity";
import {BillingInformationDto, BillingInformationInput} from "./billing-information.dto";

export class BillingInformationController {
    constructor(private readonly service: BillingInformationService) {}

    list = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = req.entity as User;
            const addresses = await this.service.listForUser(user.id);
            res.status(200).json({success: true, message: "Billing information retrieved successfully", data: addresses.map((address) => this.toDto(address))});
        } catch (error) {
            this.serverError(res, error);
        }
    };

    get = async (req: Request<{id: string}>, res: Response): Promise<void> => {
        try {
            const address = await this.service.getForUser(Number(req.params.id), (req.entity as User).id);
            if (!address) {
                res.status(404).json({success: false, message: "Billing information not found"});
                return;
            }
            res.status(200).json({success: true, message: "Billing information retrieved successfully", data: this.toDto(address)});
        } catch (error) {
            this.serverError(res, error);
        }
    };

    create = async (req: Request<unknown, unknown, BillingInformationInput>, res: Response): Promise<void> => {
        try {
            const address = await this.service.createForUser((req.entity as User).id, req.body);
            res.status(201).json({success: true, message: "Billing information created successfully", data: this.toDto(address)});
        } catch (error) {
            this.serverError(res, error);
        }
    };

    update = async (req: Request<{id: string}, unknown, BillingInformationInput>, res: Response): Promise<void> => {
        try {
            const address = await this.service.updateForUser(Number(req.params.id), (req.entity as User).id, req.body);
            if (!address) {
                res.status(404).json({success: false, message: "Billing information not found"});
                return;
            }
            res.status(200).json({success: true, message: "Billing information updated successfully", data: this.toDto(address)});
        } catch (error) {
            this.serverError(res, error);
        }
    };

    delete = async (req: Request<{id: string}>, res: Response): Promise<void> => {
        try {
            const deleted = await this.service.deleteForUser(Number(req.params.id), (req.entity as User).id);
            if (!deleted) {
                res.status(404).json({success: false, message: "Billing information not found"});
                return;
            }
            res.status(200).json({success: true, message: "Billing information deleted successfully"});
        } catch (error) {
            if (error instanceof Error && error.message === "BILLING_INFORMATION_IN_USE") {
                res.status(409).json({success: false, message: "Billing information used by an order cannot be deleted"});
                return;
            }
            this.serverError(res, error);
        }
    };

    private toDto(address: BillingInformation): BillingInformationDto {
        return {
            id: address.id,
            userId: address.user?.id ?? (address as any).userId,
            fullName: address.fullName,
            ...(address.company ? {company: address.company} : {}),
            addressLine1: address.addressLine1,
            ...(address.addressLine2 ? {addressLine2: address.addressLine2} : {}),
            city: address.city,
            ...(address.state ? {state: address.state} : {}),
            postalCode: address.postalCode,
            country: address.country,
            ...(address.phone ? {phone: address.phone} : {}),
            createdAt: address.createdAt.toISOString(),
        };
    }

    private serverError(res: Response, error: unknown): void {
        res.status(500).json({success: false, message: error instanceof Error ? error.message : "Unknown error"});
    }
}