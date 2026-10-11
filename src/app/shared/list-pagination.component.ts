import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-pagination',
  template: `
    <footer class="list-pagination" *ngIf="showPagination">
      <span>Showing {{ rangeStart }}–{{ rangeEnd }} of {{ totalRecords }}</span>
      <nav aria-label="List pagination">
        <button type="button" class="page-button" (click)="goToPage(currentPage - 1)" [disabled]="currentPage <= 1" aria-label="Previous page"><i class="pi pi-chevron-left" aria-hidden="true"></i><span>Previous</span></button>
        <span class="page-indicator">Page <strong>{{ currentPage }}</strong> of <strong>{{ pageCount }}</strong></span>
        <button type="button" class="page-button" (click)="goToPage(currentPage + 1)" [disabled]="currentPage >= pageCount" aria-label="Next page"><span>Next</span><i class="pi pi-chevron-right" aria-hidden="true"></i></button>
      </nav>
    </footer>
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .list-pagination { box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: 100%; min-height: 3.75rem; margin-top: .75rem; padding: .7rem 1rem; border-top: 1px solid var(--surface-border); color: var(--text-color-secondary); background: var(--surface-card); font-size: .82rem; }
    .list-pagination nav { display: flex; align-items: center; justify-content: flex-end; gap: .55rem; }
    .page-indicator { min-width: 7rem; color: var(--text-color-secondary); text-align: center; white-space: nowrap; }
    .page-indicator strong { color: var(--text-color); font-weight: 600; }
    .list-pagination .page-button { display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 2.25rem; padding: .4rem .7rem; border: 1px solid var(--surface-border); border-radius: 7px; color: var(--text-color); background: var(--surface-card); font: inherit; cursor: pointer; transition: background-color .15s ease, border-color .15s ease, color .15s ease; }
    .list-pagination .page-button:not(:disabled):hover { border-color: var(--primary-300); color: var(--primary-700); background: var(--primary-50); }
    .list-pagination .page-button:disabled { color: var(--text-color-secondary); background: var(--surface-50); opacity: .55; cursor: default; }
    .list-pagination .page-button i { font-size: .7rem; }
    @media (max-width: 600px) { .list-pagination { align-items: flex-start; flex-direction: column; padding: .75rem; } .list-pagination nav { width: 100%; justify-content: space-between; gap: .35rem; } .page-indicator { min-width: auto; } }
  `],
  imports: [CommonModule],
  standalone: true
})
export class ListPaginationComponent {
  @Input() totalRecords = 0;
  @Input() currentPage = 1;
  @Input() rows = 10;
  @Input() showPagination = true;
  @Output() pageChange = new EventEmitter<number>();

  get pageCount(): number {
    return Math.max(1, Math.ceil(this.totalRecords / this.rows));
  }

  get rangeStart(): number {
    return this.totalRecords ? (this.currentPage - 1) * this.rows + 1 : 0;
  }

  get rangeEnd(): number {
    return Math.min(this.currentPage * this.rows, this.totalRecords);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pageCount && page !== this.currentPage) this.pageChange.emit(page);
  }
}
