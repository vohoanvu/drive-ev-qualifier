import { 
    DealerTypes,
    EligibleVehicleTypes,
    minPurchaseOrLeaseDate,
    minimumAnnualIncome,
    minimumLeaseTermInMonths,
    newBev_FcevReward,
    newEvPriceCap, 
    newPhevReward, 
    usedBev_FcevReward, 
    usedEvPriceCap, 
    usedPhevReward
} from '../typings/constanst';
import { DriveEVRebateEligibilityForm, OOSQualifyingDealerships } from '../typings/types';

export class EVehicle
{
    eVehicleType: EligibleVehicleTypes;
    price: number;
    isNew: boolean;
    purchaseDate: Date;
    isConversion: boolean;
    dealerType: DealerTypes;
    isLease: boolean;
    OosDealerName?: string;
    leaseTermInMonths?: number;
    isRhodeIslandResident: boolean;
    isVehicleRegisteredInRI: boolean;
    ownerAnnualIncome: number;
  
    constructor(form: DriveEVRebateEligibilityForm) {
        this.eVehicleType = this.parseStringToEnumValue(EligibleVehicleTypes, form.vehicleType);
        this.price = form.vehiclePrice;
        this.isNew = !form.isUsed;
        this.purchaseDate = form.purchaseOrLeaseDate;
        this.isConversion = form.isConversion;
        this.dealerType = this.parseStringToEnumValue(DealerTypes ,form.dealerType);
        this.OosDealerName = form.OosDealerName;
        this.isLease = form.isLease;
        this.leaseTermInMonths = form.isLease ? form.leaseTermInMonths : undefined;
        this.isRhodeIslandResident = form.isRhodeIslandResident;
        this.isVehicleRegisteredInRI = form.isVehicleRegisteredInRI;
        this.ownerAnnualIncome = form.income;
    }

    isDrivePlusEligible(): boolean {
        return this.isEligibleForDriveEV() && this.ownerAnnualIncome <= minimumAnnualIncome;
    }

    isPriceEligible(): boolean {
        if (this.isNew) {
            return this.price <= newEvPriceCap;
        } else {
            return this.price <= usedEvPriceCap;
        }
    }

    isLeasedVehicleEligible(): boolean {
        if (this.isLease) {
            return this.leaseTermInMonths !== undefined && this.leaseTermInMonths <= minimumLeaseTermInMonths;
        } else {
            return true;
        }
    }

    isPurchaseDateEligible(): boolean {
        return this.purchaseDate >= minPurchaseOrLeaseDate;
    }

    isRholeIslandStatusEligible(): boolean {
        return this.isRhodeIslandResident && this.isVehicleRegisteredInRI;
    }

    isApplicationDeadlineEligible(): boolean {
        const today = new Date();
        const deadline = new Date(this.purchaseDate);
        deadline.setDate(this.purchaseDate.getDate() + 120);

        return today <= deadline;
    }

    isDealerEligible(): boolean {
        if (this.dealerType === DealerTypes.OOS_Dealer && this.OosDealerName) {
            return OOSQualifyingDealerships.has(this.OosDealerName);
        } else {
            return true;
        }
    }

    // Overall eligibility check
    isEligibleForDriveEV(): boolean {
        console.log('isPriceEligible? ', this.isPriceEligible());
        console.log('isLeasedVehicleEligible? ', this.isLeasedVehicleEligible());
        console.log('isPurchaseDateEligible? ', this.isPurchaseDateEligible());
        console.log('isRholeIslandStatusEligible? ', this.isRholeIslandStatusEligible());
        console.log('isApplicationDeadlineEligible? ', this.isApplicationDeadlineEligible());
        console.log('isDealerEligible? ', this.isDealerEligible());
        console.log('isConversion? ', this.isConversion);

        return this.isPriceEligible() 
            && this.isLeasedVehicleEligible() 
            && this.isPurchaseDateEligible()
            && this.isRholeIslandStatusEligible()
            && !this.isConversion 
            && this.isDealerEligible()
    }

    getFailReasons(): string[] {
        const failReasons: string[] = [];

        if (!this.isPriceEligible()) {
            failReasons.push('Purchase Price is not eligible');
        }

        if (!this.isLeasedVehicleEligible()) {
            failReasons.push('Leased vehicle is not eligible');
        }

        if (!this.isPurchaseDateEligible()) {
            failReasons.push('Purchase Date is not eligible');
        }

        if (!this.isRholeIslandStatusEligible()) {
            failReasons.push('Rhode Island status is not eligible');
        }

        if (this.isConversion) {
            failReasons.push('Converted vehicles are not eligible');
        }

        if (!this.isDealerEligible()) {
            failReasons.push('Dealer is not eligible');
        }

        return failReasons;
    }

    getRebateAmount(): number {
        if (this.isNew && 
            (this.eVehicleType === EligibleVehicleTypes.BEV 
                || this.eVehicleType === EligibleVehicleTypes.FCEV)) {
            return newBev_FcevReward;
        }

        if (this.isNew && this.eVehicleType === EligibleVehicleTypes.PHEV) {
            return newPhevReward;
        }

        if (!this.isNew && (this.eVehicleType === EligibleVehicleTypes.BEV || this.eVehicleType === EligibleVehicleTypes.FCEV)) {
            return usedBev_FcevReward;
        }

        if (!this.isNew && this.eVehicleType === EligibleVehicleTypes.PHEV) {
            return usedPhevReward;
        }

        return 0;
    }

    private parseStringToEnumValue<T extends Record<string, unknown>>(enumType: T, value: string): T[keyof T] {
        let result;
        Object.keys(enumType).forEach((key) => {
            if (enumType[key as keyof T] === value) {
                result = enumType[key as keyof T];
            }
        });
        if (result === undefined) {
            throw new Error(`Invalid enum value: ${value}`);
        }
        return result;
    }
}  