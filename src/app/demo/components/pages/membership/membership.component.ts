import { Component } from '@angular/core';
import { AuthService } from 'src/app/demo/service/auth.service';

declare global {
  interface Window { Razorpay?: any; }
}

interface MembershipPlan {
  name: string;
  amount: number;
  duration: string;
  durationMonths: number;
  clinicPlan: 'BRONZE' | 'SILVER' | 'GOLD';
  icon: string;
  features: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-membership',
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.scss']
})
export class MembershipComponent {
  readonly plans: MembershipPlan[] = [
    {
      name: 'Monthly', amount: 1999, duration: '1 month', durationMonths: 1, clinicPlan: 'BRONZE', icon: 'pi-calendar',
      features: [
        'Clinic dashboard',
        'Patient records',
        'Appointment scheduling and calendar',
        'Invoices and payment tracking'
      ]
    },
    {
      name: 'Quarterly', amount: 6999, duration: '3 months', durationMonths: 3, clinicPlan: 'SILVER', icon: 'pi-calendar-plus', featured: true,
      features: [
        'Everything in Monthly',
        'Doctor and staff management',
        'Attendance tracking',
        'Insurance records',
        'Treatment and condition records'
      ]
    },
    {
      name: 'Yearly', amount: 10499, duration: '12 months', durationMonths: 12, clinicPlan: 'GOLD', icon: 'pi-star',
      features: [
        'Everything in Quarterly',
        'Appointment activity summaries',
        'Income and invoice summaries',
        'Patient visit history'
      ]
    }
  ];
  busyPlan = '';
  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private auth: AuthService) {}

  async buy(plan: MembershipPlan): Promise<void> {
    this.message = '';
    this.busyPlan = plan.name;

    try {
      await this.loadRazorpay();
      this.auth.createPaymentOrder(plan.amount * 100).subscribe({
        next: (response) => this.openCheckout(response, plan),
        error: () => {
          this.busyPlan = '';
          this.showMessage('Could not start checkout. Please try again.', 'error');
        }
      });
    } catch {
      this.busyPlan = '';
      this.showMessage('Secure checkout is unavailable right now. Please try again later.', 'error');
    }
  }

  private openCheckout(response: any, plan: MembershipPlan): void {
    const order = response?.order || response?.data?.order || response?.data || response;
    const key = response?.keyId || response?.key || response?.data?.keyId || order?.key_id;
    const orderId = order?.id || order?.orderId;

    if (!key || !orderId || !window.Razorpay) {
      this.busyPlan = '';
      this.showMessage('Checkout setup is incomplete. Please contact the clinic.', 'error');
      return;
    }

    let finished = false;
    const checkout = new window.Razorpay({
      key,
      amount: order.amount || plan.amount * 100,
      currency: order.currency || 'INR',
      name: 'Techno My clinic',
      description: `${plan.name} membership (${plan.duration})`,
      order_id: orderId,
      handler: (payment: any) => {
        const planActivatedAt = new Date();
        const planExpiresAt = this.addMonths(planActivatedAt, plan.durationMonths);
        const membershipPayload = {
          ...payment,
          plan: plan.clinicPlan,
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
            this.showMessage(`${plan.name} membership payment verified successfully.`, 'success');
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
