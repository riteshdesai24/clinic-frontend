import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/demo/service/auth.service';
import { MembershipAccessService } from 'src/app/core/membership-access.service';

declare global {
  interface Window { Razorpay?: any; }
}

interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
  durationMonths: number;
  staffAllowed: boolean;
}

@Component({
  selector: 'app-membership',
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.scss']
})
export class MembershipComponent implements OnInit {
  plans: MembershipPlan[] = [];
  loadingPlans = false;
  plansError = '';
  busyPlan = '';
  message = '';
  messageType: 'success' | 'error' = 'success';
  hasActiveMembership = false;
  currentPlanName = '';
  currentPlanExpiresAt = '';
  currentPlan: MembershipPlan | null = null;

  constructor(private auth: AuthService, private membershipAccess: MembershipAccessService, private router: Router) {
    this.hasActiveMembership = this.membershipAccess.hasActivePlan();
    this.readCurrentMembership();
  }

  ngOnInit(): void {
    this.loadingPlans = true;
    this.auth.getPlans().subscribe({
      next: response => {
        const records = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        this.plans = records.map((record: any) => ({
          id: String(record?._id || record?.id || record?.name || ''),
          name: String(record?.name || ''),
          description: String(record?.description || ''),
          features: Array.isArray(record?.features)
            ? record.features.map((feature: any) => String(feature)).filter(Boolean)
            : typeof record?.features === 'string'
              ? record.features.split(/[\n,;]+/).map((feature: string) => feature.trim()).filter(Boolean)
              : [],
          price: Number(record?.price),
          durationMonths: Number(record?.durationMonths || 1),
          staffAllowed: record?.staffAllowed === true
        })).filter((plan: MembershipPlan) => !!plan.name && Number.isFinite(plan.price) && plan.price >= 0);
        this.readCurrentMembership();
        this.loadingPlans = false;
      },
      error: error => {
        this.plansError = error?.error?.message || 'Could not load memberships. Please try again.';
        this.loadingPlans = false;
      }
    });
  }

  durationLabel(plan: MembershipPlan): string {
    return `${plan.durationMonths} ${plan.durationMonths === 1 ? 'month' : 'months'}`;
  }

  private readCurrentMembership(): void {
    const storedClinic = this.readStoredObject('clinic') || {};
    const storedUser = this.readStoredObject('user') || {};
    const userClinic = storedUser.clinic || {};
    this.currentPlanName = String(storedClinic.plan || storedUser.plan || userClinic.plan || '').trim();
    this.currentPlanExpiresAt = storedClinic.planExpiresAt || storedUser.planExpiresAt || userClinic.planExpiresAt || '';
    const currentName = this.currentPlanName.toLowerCase();
    this.currentPlan = this.plans.find(plan =>
      plan.name.toLowerCase() === currentName || plan.id.toLowerCase() === currentName
    ) || null;
    this.hasActiveMembership = this.membershipAccess.hasActivePlan();
  }

  private readStoredObject(key: string): any {
    try {
      return JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  }

  async buy(plan: MembershipPlan): Promise<void> {
    this.message = '';
    this.busyPlan = plan.name;

    try {
      await this.loadRazorpay();
      this.auth.createPaymentOrder(plan.price * 100, plan.name).subscribe({
        next: (response) => this.openCheckout(response, plan),
        error: (error) => {
          this.busyPlan = '';
          this.showMessage(error?.error?.message || 'Could not start checkout. Please try again.', 'error');
        }
      });
    } catch {
      this.busyPlan = '';
      this.showMessage('Secure checkout is unavailable right now. Please try again later.', 'error');
    }
  }

  private openCheckout(response: any, plan: MembershipPlan): void {
    const payload = response?.data?.data || response?.data || response;
    const order = payload?.order || response?.order || payload;
    const key = response?.keyId || response?.key_id || response?.razorpay_key_id || response?.key || response?.razorpayKeyId
      || response?.data?.keyId || response?.data?.key_id || response?.data?.razorpay_key_id || response?.data?.key || response?.data?.razorpayKeyId
      || payload?.keyId || payload?.key_id || payload?.razorpay_key_id || payload?.key || payload?.razorpayKeyId
      || order?.key_id;
    const orderId = order?.id || order?.orderId || payload?.orderId;

    if (response?.success === false || payload?.success === false) {
      this.busyPlan = '';
      this.showMessage(response?.message || payload?.message || 'The payment order could not be created.', 'error');
      return;
    }

    if (!key || !orderId || !window.Razorpay) {
      this.busyPlan = '';
      this.showMessage('The payment order was created, but checkout details are missing. Ensure the API returns the Razorpay key ID and order ID.', 'error');
      return;
    }

    const orderAmount = Number(order?.amount);
    if (Number.isFinite(orderAmount) && orderAmount !== plan.price * 100) {
      this.busyPlan = '';
      this.showMessage('The order amount does not match the selected membership. Please contact the clinic.', 'error');
      return;
    }

    let finished = false;
    const checkout = new window.Razorpay({
      key,
      amount: order.amount || plan.price * 100,
      currency: order.currency || 'INR',
      name: 'Techno My clinic',
      description: `${plan.name} membership (${this.durationLabel(plan)})`,
      order_id: orderId,
      handler: (payment: any) => {
        if (!payment?.razorpay_order_id || !payment?.razorpay_payment_id || !payment?.razorpay_signature) {
          finished = true;
          this.busyPlan = '';
          this.showMessage('Razorpay did not return the required payment details. Please contact the clinic before retrying.', 'error');
          return;
        }
        const planActivatedAt = new Date();
        const planExpiresAt = this.addMonths(planActivatedAt, plan.durationMonths);
        const membershipPayload = {
          ...payment,
          plan: plan.name,
          planActivatedAt: planActivatedAt.toISOString(),
          planExpiresAt: planExpiresAt.toISOString()
        };

        this.auth.verifyPayment(membershipPayload).subscribe({
          next: (result) => {
            finished = true;
            this.busyPlan = '';
            if (result?.verified === false || result?.success === false) {
              this.showMessage('Payment could not be verified. Please contact the clinic before retrying.', 'error');
              return;
            }
            const verifiedData = result?.data?.data || result?.data || result;
            const verifiedClinic = verifiedData?.clinic || result?.clinic;
            const membership = result?.membership || verifiedData?.membership || {};
            const activatedAt = verifiedClinic?.planActivatedAt || membership?.activatedAt || verifiedData?.planActivatedAt || membershipPayload.planActivatedAt;
            const expiresAt = verifiedClinic?.planExpiresAt || membership?.expiresAt || verifiedData?.planExpiresAt || membershipPayload.planExpiresAt;
            this.membershipAccess.savePlan(plan.name, activatedAt, expiresAt, verifiedClinic);
            this.refreshCurrentUserAndReturnToDashboard(plan.name, activatedAt, expiresAt);
          },
          error: () => {
            finished = true;
            this.busyPlan = '';
            this.showMessage('We could not verify this payment. Please contact the clinic before retrying.', 'error');
          }
        });
      },
      modal: {
        ondismiss: () => {
          if (!finished) this.busyPlan = '';
        }
      },
      theme: { color: '#0d78ad' }
    });

    checkout.on('payment.failed', () => {
      this.busyPlan = '';
      this.showMessage('Payment did not go through. You can try again.', 'error');
    });
    checkout.open();
  }

  private refreshCurrentUserAndReturnToDashboard(planName: string, activatedAt: string, expiresAt: string): void {
    this.auth.getCurrentUser().subscribe({
      next: response => {
        const data = response?.data?.data || response?.data || response;
        const user = data?.user;
        const clinic = data?.clinic;
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          sessionStorage.setItem('user', JSON.stringify(user));
        }
        if (clinic) {
          localStorage.setItem('clinic', JSON.stringify(clinic));
          sessionStorage.setItem('clinic', JSON.stringify(clinic));
        }
        this.membershipAccess.savePlan(
          clinic?.plan || user?.plan || planName,
          clinic?.planActivatedAt || user?.planActivatedAt || activatedAt,
          clinic?.planExpiresAt || user?.planExpiresAt || expiresAt,
          clinic
        );
        this.hasActiveMembership = true;
        this.showMessage(`${planName} membership activated successfully.`, 'success');
        this.router.navigate(['/']);
      },
      error: () => {
        this.hasActiveMembership = true;
        this.showMessage('Payment is verified, but account details could not be refreshed. Please reload your dashboard.', 'error');
        this.router.navigate(['/']);
      }
    });
  }

  private loadRazorpay(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
      const script = existing || document.createElement('script');
      if (!existing) {
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.dataset['razorpayCheckout'] = 'true';
        document.head.appendChild(script);
      }
      script.onload = () => window.Razorpay ? resolve() : reject();
      script.onerror = () => reject();
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    const originalDay = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDayOfTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(originalDay, lastDayOfTargetMonth));
    return result;
  }
}
