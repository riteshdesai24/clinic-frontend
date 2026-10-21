import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-patient-profile',
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.scss'],
})
export class PatientProfileComponent implements OnChanges, OnDestroy {
  @Input() patient: Record<string, any> = {};
  @Input() patientId: string | null = null;
  @Input() appointments: any[] = [];
  @Input() appointmentsLoading = false;
  @Input() appointmentsError = '';
  @Input() recordLoading = false;

  uploadedDocuments: any[] = [];
  documentsLoading = false;
  documentsError = '';
  previewVisible = false;
  previewLoading = false;
  previewError = '';
  previewUrl: SafeResourceUrl | null = null;
  previewImageUrl: string | null = null;
  previewKind: 'image' | 'pdf' | 'other' = 'other';
  previewingDocument: any = null;
  previewBlob: Blob | null = null;
  private previewObjectUrl: string | null = null;

  constructor(private api: AuthService, private sanitizer: DomSanitizer) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patientId'] && this.patientId) this.loadDocuments();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  loadDocuments(): void {
    if (!this.patientId) return;
    this.documentsLoading = true;
    this.documentsError = '';
    this.api.getPatientAttachments(this.patientId).subscribe({
      next: response => {
        const list = response?.data?.attachments ?? response?.data?.documents ?? response?.data?.files ??
          response?.attachments ?? response?.documents ?? response?.files ?? response?.data ?? [];
        this.uploadedDocuments = Array.isArray(list) ? list : [];
        this.documentsLoading = false;
      },
      error: () => {
        this.uploadedDocuments = [];
        this.documentsLoading = false;
        this.documentsError = 'Could not load patient documents.';
      }
    });
  }

  documentName(file: any): string {
    return file?.originalName || file?.originalname || file?.originalFilename ||
      file?.fileName || file?.filename || file?.name || 'Document';
  }

  documentSize(file: any): string {
    const bytes = Number(file?.size ?? file?.fileSize ?? 0);
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  previewKindFor(file: any): 'image' | 'pdf' | 'other' {
    return this.getPreviewKind(file, '');
  }

  previewDocument(file: any): void {
    const attachmentId = file?._id || file?.id || file?.attachmentId;
    if (!this.patientId || !attachmentId) return;
    this.previewingDocument = file;
    this.previewVisible = true;
    this.previewLoading = true;
    this.previewError = '';
    this.api.downloadPatientAttachment(this.patientId, attachmentId).subscribe({
      next: blob => {
        this.previewBlob = blob;
        this.previewKind = this.getPreviewKind(file, blob.type);
        this.revokePreviewUrl();
        this.previewObjectUrl = URL.createObjectURL(blob);
        this.previewImageUrl = this.previewObjectUrl;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl);
        this.previewLoading = false;
      },
      error: () => {
        this.previewLoading = false;
        this.previewError = 'Could not open this document. Try downloading it instead.';
      }
    });
  }

  closePreview(): void {
    this.previewVisible = false;
    this.previewingDocument = null;
    this.previewBlob = null;
    this.previewUrl = null;
    this.previewImageUrl = null;
    this.previewError = '';
    this.revokePreviewUrl();
  }

  downloadPreview(): void {
    if (!this.previewBlob || !this.previewingDocument) return;
    const url = this.previewObjectUrl || URL.createObjectURL(this.previewBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.documentName(this.previewingDocument);
    link.click();
  }

  private getPreviewKind(file: any, mimeType: string): 'image' | 'pdf' | 'other' {
    const mime = String(file?.mimeType || file?.mimetype || mimeType || '').toLowerCase();
    const name = this.documentName(file).toLowerCase();
    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return 'image';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    return 'other';
  }

  private revokePreviewUrl(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }

  get fullName(): string {
    const name = [this.patient['title'], this.patient['firstName'], this.patient['middleName'], this.patient['lastName'], this.patient['suffix']]
      .filter(Boolean)
      .join(' ');
    return name || 'Patient profile';
  }

  get initials(): string {
    return [this.patient['firstName'], this.patient['lastName']]
      .filter(Boolean)
      .map((part: string) => part.charAt(0))
      .join('')
      .toUpperCase() || 'P';
  }

  get address(): string {
    return [this.patient['address1'], this.patient['address2'], this.patient['address3'], this.patient['locality'], this.patient['city'], this.patient['state'], this.patient['pincode'], this.patient['country']]
      .filter(Boolean)
      .join(', ');
  }

  display(value: any, fallback = 'Not provided'): string {
    if (Array.isArray(value)) {
      const values = value.map((item) => typeof item === 'object' ? item?.name || item?.label || item?.value : item).filter(Boolean);
      return values.join(', ') || fallback;
    }
    if (value && typeof value === 'object') return value.name || value.label || fallback;
    return value == null || value === '' ? fallback : String(value);
  }

  sectionTarget(section: string): string {
    return `#${section}`;
  }
}
