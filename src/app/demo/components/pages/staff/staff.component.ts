import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { HttpEventType } from '@angular/common/http';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-staff',
  templateUrl: './staff.component.html',
  styleUrls: ['./staff.component.scss']
})
export class StaffComponent implements OnInit, OnDestroy {

  staffForm!: FormGroup;

  loading = false;
  error: string | null = null;
  success: string | null = null;
  passwordSent = false;

  clinicname = '';
  clinicId = '';
  adminEmail = 'riteshdesai24@gmail.com';

  roles = ['STAFF', 'DOCTOR'];

  isUser: string | null = null;
  isEdit = false;
  isview = false;

  userId: string | null = null;
  selectedDocuments: { file: File; fileName: string }[] = [];
  documentsUploading = false;
  documentUploadProgress = 0;
  documentsDragOver = false;
  documentsError = '';
  uploadedDocuments: any[] = [];
  previewVisible = false;
  previewLoading = false;
  previewError = '';
  previewUrl: SafeResourceUrl | null = null;
  previewImageUrl: string | null = null;
  previewKind: 'image' | 'pdf' | 'other' = 'other';
  previewingDocument: any = null;
  previewBlob: Blob | null = null;
  private previewObjectUrl: string | null = null;
  documentsLoading = false;
  documentsListError = '';
  activeDoctorTab: 'details' | 'documents' = 'details';
  clinic: any = {};

  constructor(
    public layoutService: LayoutService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private messageService: MessageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnDestroy(): void { this.revokePreviewUrl(); }

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('id');
    this.isUser = this.route.snapshot.queryParamMap.get('isUser');

    if (this.userId) this.isEdit = true;

    const viewMode = this.route.snapshot.queryParamMap.get('view');
    if (viewMode === 'true') this.isview = true;

    this.clinic = localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}';
    this.clinic = JSON.parse(this.clinic);
    this.clinicname = this.clinic.clinicName || '';
    this.clinicId   = this.clinic._id || '';

    this.staffForm = this.fb.group({
      clinicName:     [{ value: this.clinicname, disabled: true }],
      staffname:      ['', [Validators.required, Validators.minLength(3)]],
      email:          ['', [Validators.required, Validators.email]],
      phone:          ['', Validators.required],
      // password:       [''],
      role:           ['STAFF', Validators.required],
      specialization: [''],
      registrationNumber: ['']
    });

    if (this.isUser === 'Doctor') {
      this.staffForm.patchValue({ role: 'DOCTOR' });
      this.staffForm.get('role')?.disable();
      this.staffForm.get('specialization')?.setValidators([Validators.required]);
      this.staffForm.get('specialization')?.updateValueAndValidity();
    }

    this.staffForm.get('role')?.valueChanges.subscribe(role => {
      const spec = this.staffForm.get('specialization');
      if (role === 'DOCTOR') {
        spec?.setValidators([Validators.required]);
      } else {
        spec?.clearValidators();
        spec?.setValue('');
      }
      spec?.updateValueAndValidity();
    });

    this.togglePasswordValidation();

    if (this.isEdit && this.userId) {
      if (this.isUser === 'Doctor') {
        this.loadDoctorDetails(this.userId);
      } else {
        this.loadStaffDetails(this.userId);
      }
    }

    if (this.isview) {
      this.staffForm.disable();
    }
  }

  get f() {
    return this.staffForm.controls;
  }

  togglePasswordValidation(): void {
    const pass = this.staffForm.get('password');
    if (this.isEdit || this.isview) {
      pass?.clearValidators();
      pass?.setValue('');
    } else {
      pass?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    pass?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }
    this.isEdit ? this.updateUser() : this.createUser();
  }

  createUser(): void {
    this.loading = true;
    const formData = this.staffForm.getRawValue();
    const data: any = {
      staffname: formData.staffname,
      email:     formData.email,
      phone:     formData.phone,
      role:      formData.role
    };

    // Only include specialization if DOCTOR
    if (formData.role === 'DOCTOR' && formData.specialization) {
      data.specialization = formData.specialization;
    }
    if (formData.role === 'DOCTOR' && formData.registrationNumber) {
      data.registrationNumber = formData.registrationNumber;
    }

    // Server auto-generates password — do not send from frontend
    const api$ = this.isUser === 'Doctor'
      ? this.authService.createDoctor(data)
      : this.authService.createStaff(data);

    api$.subscribe({
      next: (res: any) => {
        const doctorId = res?.data?.doctor?._id || res?.data?._id || res?.doctor?._id || res?._id;
        if (this.isUser === 'Doctor' && this.selectedDocuments.length && doctorId) {
          this.uploadDoctorDocuments(doctorId, () => this.showCreated());
          return;
        }
        if (this.isUser === 'Doctor' && this.selectedDocuments.length && !doctorId) {
          this.loading = false;
          this.error = 'Doctor saved, but the server did not return a doctor ID for document upload.';
          return;
        }
        this.messageService.add({
          key: 'tst', severity: 'success',
          summary: 'Success',
          detail: 'Created successfully. Login credentials sent via email and SMS.'
        });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  updateUser(): void {
    if (!this.userId) return;
    this.loading = true;
    const data = this.staffForm.getRawValue();
    if (!data.password) delete data.password;

    const api$ = this.isUser === 'Doctor'
      ? this.authService.updateDoctor(this.userId, data)
      : this.authService.updateStaff(this.userId, data);

    api$.subscribe({
      next: () => {
        if (this.isUser === 'Doctor' && this.selectedDocuments.length) {
          this.uploadDoctorDocuments(this.userId!, () => this.showUpdated());
          return;
        }
        this.messageService.add({
          key: 'tst', severity: 'success',
          summary: 'Updated',
          detail: 'Updated successfully'
        });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  deleteUser(): void {
    if (!this.userId) return;
    if (!confirm('Are you sure you want to delete this user?')) return;
    this.loading = true;

    const api$ = this.isUser === 'Doctor'
      ? this.authService.deleteDoctor(this.userId)
      : this.authService.deleteStaff(this.userId);

    api$.subscribe({
      next: () => {
        this.messageService.add({
          key: 'tst', severity: 'success',
          summary: 'Deleted',
          detail: 'Deleted successfully'
        });
        this.navigateBack();
      },
      error: err => this.handleError(err)
    });
  }

  loadStaffDetails(id: string): void {
    this.loading = true;
    this.authService.getStaffDetails(id).subscribe({
      next: res => {
        const s = this.unwrapRecord(res);
        this.staffForm.patchValue({
          staffname: s.staffname ?? s.name ?? s.fullName ?? '',
          email:     s.email ?? '',
          phone:     s.phone ?? s.mobile ?? ''
        });
        this.togglePasswordValidation();
        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  loadDoctorDetails(id: string): void {
    this.loading = true;
    this.authService.getDoctorDetails(id).subscribe({
      next: res => {
        const d = this.unwrapRecord(res);
        this.staffForm.patchValue({
          staffname:      d.staffname ?? d.name ?? d.fullName ?? '',
          email:          d.email ?? '',
          phone:          d.phone ?? d.mobile ?? '',
          specialization: d.specialization ?? d.speciality ?? '',
          registrationNumber: d.registrationNumber ?? d.registrationNo ?? d.medicalRegistrationNumber ?? ''
        });
        this.loadDoctorDocuments(id);
        this.togglePasswordValidation();
        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  onDocumentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addDocuments(Array.from(input.files || []));
    input.value = '';
  }

  onDocumentsDropped(event: DragEvent): void {
    event.preventDefault();
    this.documentsDragOver = false;
    this.addDocuments(Array.from(event.dataTransfer?.files || []));
  }

  private addDocuments(files: File[]): void {
    const allowed = /\.(jpe?g|png|pdf|svg|docx?)$/i;
    const maxBytes = 24 * 1024 * 1024;
    const rejected = files.filter(file => !allowed.test(file.name) || file.size > maxBytes);
    this.documentsError = rejected.length ? 'Use JPG, PNG, PDF, SVG, DOC or DOCX files up to 24 MB.' : '';
    this.selectedDocuments = [...this.selectedDocuments, ...files
      .filter(file => allowed.test(file.name) && file.size <= maxBytes)
      .map(file => ({ file, fileName: file.name }))];
  }

  updateDocumentFileName(index: number, fileName: string): void {
    const document = this.selectedDocuments[index];
    if (document) document.fileName = fileName;
  }

  removeSelectedDocument(index: number): void {
    this.selectedDocuments = this.selectedDocuments.filter((_, i) => i !== index);
  }

  private uploadDoctorDocuments(doctorId: string, done: () => void): void {
    this.documentsUploading = true;
    this.documentUploadProgress = 0;
    this.authService.uploadDoctorAttachments(doctorId, this.selectedDocuments).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.documentUploadProgress = Math.round(event.loaded / event.total * 100);
        }
        if (event.type === HttpEventType.Response) {
          this.documentsUploading = false;
          this.selectedDocuments = [];
          this.loadDoctorDocuments(doctorId);
          done();
        }
      },
      error: err => {
        this.documentsUploading = false;
        this.handleError(err);
      }
    });
  }

  loadDoctorDocuments(doctorId = this.userId): void {
    if (!doctorId) return;
    this.documentsLoading = true;
    this.documentsListError = '';
    this.authService.getDoctorAttachments(doctorId).subscribe({
      next: response => {
        const list = response?.data?.attachments ?? response?.data?.documents ?? response?.data?.files ??
          response?.attachments ?? response?.documents ?? response?.files ?? response?.data ?? [];
        this.uploadedDocuments = Array.isArray(list) ? list : [];
        this.documentsLoading = false;
      },
      error: () => {
        this.uploadedDocuments = [];
        this.documentsLoading = false;
        this.documentsListError = 'Could not load uploaded documents.';
      }
    });
  }

  downloadDoctorDocument(file: any): void {
    const id = file?._id || file?.id || file?.attachmentId;
    if (!this.userId || !id) return;
    this.authService.downloadDoctorAttachment(this.userId, id).subscribe({
      next: blob => this.saveDownloadedDocument(blob, this.documentName(file)),
      error: () => this.documentsListError = 'Could not download this document.'
    });
  }

  previewDoctorDocument(file: any): void {
    const id = file?._id || file?.id || file?.attachmentId;
    if (!this.userId || !id) return;
    this.previewingDocument = file; this.previewVisible = true; this.previewLoading = true; this.previewError = '';
    this.authService.downloadDoctorAttachment(this.userId, id).subscribe({
      next: blob => {
        this.previewBlob = blob; this.previewKind = this.documentPreviewKind(file, blob.type); this.revokePreviewUrl();
        this.previewObjectUrl = URL.createObjectURL(blob); this.previewImageUrl = this.previewObjectUrl;
        this.previewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewObjectUrl); this.previewLoading = false;
      },
      error: () => { this.previewLoading = false; this.previewError = 'Could not open this document. Try downloading it instead.'; }
    });
  }

  closeDocumentPreview(): void {
    this.previewVisible = false; this.previewingDocument = null; this.previewBlob = null;
    this.previewUrl = null; this.previewImageUrl = null; this.previewError = ''; this.revokePreviewUrl();
  }

  downloadPreviewDocument(): void {
    if (this.previewBlob && this.previewingDocument) this.saveDownloadedDocument(this.previewBlob, this.documentName(this.previewingDocument));
  }

  documentPreviewKind(file: any, mimeType = ''): 'image' | 'pdf' | 'other' {
    const mime = String(file?.mimeType || file?.mimetype || mimeType).toLowerCase();
    const name = this.documentName(file).toLowerCase();
    if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(name)) return 'image';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    return 'other';
  }

  private revokePreviewUrl(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }

  documentName(file: any): string {
    return file?.originalName || file?.originalname || file?.originalFilename ||
      file?.fileName || file?.filename || file?.name || 'Document';
  }

  private saveDownloadedDocument(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  documentIcon(file: any): string {
    const extension = this.documentName(file).split('.').pop()?.toLowerCase();
    return extension === 'pdf' ? 'pi pi-file-pdf' : ['doc', 'docx'].includes(extension || '') ? 'pi pi-file-word' : 'pi pi-image';
  }

  formatFileSize(bytes: number): string {
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private showCreated(): void {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Success', detail: 'Created successfully. Login credentials sent via email and SMS.' });
    this.afterSave();
  }

  private showUpdated(): void {
    this.messageService.add({ key: 'tst', severity: 'success', summary: 'Updated', detail: 'Updated successfully' });
    this.afterSave();
  }

  private unwrapRecord(response: any): any {
    let record = response;
    // APIs may wrap a record as data, doctor, staff, or user. Unwrap those
    // containers while preserving the actual document fields.
    for (let depth = 0; depth < 4; depth++) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) break;
      const nested = record.data ?? record.doctor ?? record.staff ?? record.user;
      if (!nested || nested === record) break;
      record = nested;
    }
    return Array.isArray(record) ? (record[0] || {}) : (record || {});
  }

  afterSave(): void {
    this.loading = false;
    setTimeout(() => this.navigateBack(), 1000);
  }

  navigateBack(): void {
    this.router.navigate([
      this.isUser === 'Doctor' ? '/pages/doctor-list' : '/pages/staff-list'
    ]);
  }

  handleError(err: any): void {
    this.loading = false;
    this.error = err?.error?.message || err?.message || 'Operation failed';
    this.messageService.add({
      key: 'tst', severity: 'error',
      summary: 'Error',
      detail: this.error ?? 'Something went wrong'
    });
  }

  onCancel(): void {
    this.navigateBack();
  }
}
