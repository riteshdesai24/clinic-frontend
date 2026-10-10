import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

interface InvoicePaymentDraft {
  amount: number;
  method: string;
  reference: string;
}

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss']
})
export class InvoiceListComponent implements OnInit {
  invoices: any[] = [];
  loading = false;
  savingPayment = false;
  error = '';
  selectedInvoiceId = '';
  paymentMethods = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'ONLINE', 'OTHER'];
  paymentDraft: InvoicePaymentDraft = { amount: 0, method: 'CASH', reference: '' };

  constructor(private api: AuthService, private messages: MessageService) {}

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading = true;
    this.error = '';
    this.api.getInvoices({ page: 1, limit: 100 }).subscribe({
      next: (response: any) => {
        this.invoices = response?.data || [];
        this.loading = false;
      },
      error: (error: any) => {
        this.error = error?.error?.message || 'Could not load invoices.';
        this.loading = false;
      }
    });
  }

  startPayment(invoice: any): void {
    this.selectedInvoiceId = invoice._id;
    this.paymentDraft = {
      amount: Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0)),
      method: 'CASH',
      reference: ''
    };
  }

  cancelPayment(): void {
    this.selectedInvoiceId = '';
  }

  savePayment(): void {
    const amount = Number(this.paymentDraft.amount);
    if (!this.selectedInvoiceId || !Number.isFinite(amount) || amount <= 0) return;
    this.savingPayment = true;
    this.api.recordInvoicePayment(this.selectedInvoiceId, {
      amount,
      method: this.paymentDraft.method,
      reference: this.paymentDraft.reference.trim() || undefined
    }).subscribe({
      next: () => {
        this.savingPayment = false;
        this.selectedInvoiceId = '';
        this.messages.add({ severity: 'success', summary: 'Payment recorded', detail: 'Invoice balance has been updated.' });
        this.loadInvoices();
      },
      error: (error: any) => {
        this.savingPayment = false;
        this.messages.add({ severity: 'error', summary: 'Payment not recorded', detail: error?.error?.message || 'Please reload the invoice and try again.' });
      }
    });
  }

  balance(invoice: any): number {
    return Math.max(0, Number(invoice.totalAmount || 0) - Number(invoice.amountPaid || 0));
  }
}
