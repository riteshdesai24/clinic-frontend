import { Injectable } from '@angular/core';

const PAID_PLANS = new Set(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']);

@Injectable({ providedIn: 'root' })
export class MembershipAccessService {
    hasActivePlan(): boolean {
        const clinic = this.readStoredObject('clinic');
        const user = this.readStoredObject('user');
        const nestedClinic = user?.clinic || {};
        const plan = String(clinic?.plan || user?.plan || nestedClinic.plan || '').toUpperCase();
        const expiresAt = clinic?.planExpiresAt || user?.planExpiresAt || nestedClinic.planExpiresAt;
        const expiryTime = expiresAt ? new Date(expiresAt).getTime() : NaN;

        return PAID_PLANS.has(plan) && Number.isFinite(expiryTime) && expiryTime > Date.now();
    }

    savePlan(plan: string, activatedAt: string, expiresAt: string, clinicResponse?: any): void {
        const clinic = { ...(clinicResponse || this.readStoredObject('clinic') || {}) };
        clinic.plan = plan;
        clinic.planActivatedAt = activatedAt;
        clinic.planExpiresAt = expiresAt;
        this.writeStoredObject('clinic', clinic);

        const user = { ...(this.readStoredObject('user') || {}) };
        user.plan = plan;
        user.planActivatedAt = activatedAt;
        user.planExpiresAt = expiresAt;
        this.writeStoredObject('user', user);

        window.dispatchEvent(new CustomEvent('clinic-membership-updated'));
    }

    private readStoredObject(key: string): any {
        const value = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    private writeStoredObject(key: string, value: any): void {
        const serialized = JSON.stringify(value);
        if (localStorage.getItem('token')) localStorage.setItem(key, serialized);
        if (sessionStorage.getItem('token')) sessionStorage.setItem(key, serialized);
    }
}
