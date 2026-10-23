import { Component, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { HttpEventType } from '@angular/common/http';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss']
})
export class PatientComponent implements OnInit, OnDestroy {

  patientForm!: FormGroup;

  loading = false;
  error: string | null = null;
  success: string | null = null;
  validationAttempted = false;


  isEdit = false;
  isView = false;

  patientId: string | null = null;
  appointmentDialogVisible = false;
  appointmentPatientName = '';
  selectedDocuments: { file: File; fileName: string }[] = [];
  documentsUploading = false;
  documentUploadProgress = 0;
  documentsDragOver = false;
  documentsError = '';
  uploadedDocuments: any[] = [];
  documentsLoading = false;
  documentsListError = '';
  previewVisible = false;
  previewLoading = false;
  previewError = '';
  previewUrl: SafeResourceUrl | null = null;
  previewImageUrl: string | null = null;
  previewKind: 'image' | 'pdf' | 'other' = 'other';
  previewingDocument: any = null;
  previewBlob: Blob | null = null;
  private previewObjectUrl: string | null = null;

  // ---------- Personal Info ----------
  titles = [
    { label: 'Mr', value: 'MR' },
    { label: 'Mrs', value: 'MRS' },
    { label: 'Ms', value: 'MS' },
    { label: 'Dr', value: 'DR' },
    { label: 'Master', value: 'MASTER' }
  ];

  genders = [
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
    { label: 'Transgender', value: 'TRANSGENDER' },
    { label: 'Unknown', value: 'UNKNOWN' }
  ];

  maritalStatuses = [
    { label: 'Single', value: 'SINGLE' },
    { label: 'Married', value: 'MARRIED' },
    { label: 'Divorced', value: 'DIVORCED' },
    { label: 'Widowed', value: 'WIDOWED' }
  ];

  // ---------- Address / Contact ----------
  countries = [
    { label: 'India', value: 'IN' },
    { label: 'United States', value: 'US' },
    { label: 'United Kingdom', value: 'UK' }
  ];

  // ---------- Medical ----------
  medicalConditionOptions: { label: string; value: string }[] = [];
  dentalConditionOptions: { label: string; value: string }[] = [];
  private savedMedicalConditions: string[] = [];
  private savedDentalConditions: string[] = [];

  // ---------- Insurance ----------
  insuranceCompanies: any[] = [];
  filteredInsuranceCompanies: any[] = [];

  // ---------- Demographics ----------
  languages = [
    { label: 'English', value: 'ENGLISH' },
    { label: 'Hindi', value: 'HINDI' },
    { label: 'Marathi', value: 'MARATHI' }
  ];

  religions = [
    { label: 'Unknown', value: 'UNKNOWN' },
    { label: 'Hindu', value: 'HINDU' },
    { label: 'Muslim', value: 'MUSLIM' },
    { label: 'Christian', value: 'CHRISTIAN' },
    { label: 'Sikh', value: 'SIKH' },
    { label: 'Other', value: 'OTHER' }
  ];

  occupations = [
    { label: 'Unknown', value: 'UNKNOWN' },
    { label: 'Student', value: 'STUDENT' },
    { label: 'Employed', value: 'EMPLOYED' },
    { label: 'Self-Employed', value: 'SELF_EMPLOYED' },
    { label: 'Retired', value: 'RETIRED' }
  ];

  bloodGroups = [
    { label: 'A+', value: 'A_POS' },
    { label: 'A-', value: 'A_NEG' },
    { label: 'B+', value: 'B_POS' },
    { label: 'B-', value: 'B_NEG' },
    { label: 'AB+', value: 'AB_POS' },
    { label: 'AB-', value: 'AB_NEG' },
    { label: 'O+', value: 'O_POS' },
    { label: 'O-', value: 'O_NEG' }
  ];

  discProfiles = [
    { label: 'Dominance', value: 'D' },
    { label: 'Influence', value: 'I' },
    { label: 'Steadiness', value: 'S' },
    { label: 'Conscientiousness', value: 'C' }
  ];

  routeItems: MenuItem[] = [];
  activeTab: number = 0;
  clinicData: any;

  private readonly requiredControlsByTab = [
    ['firstName', 'lastName', 'gender'],
    ['phone'],
    [],
    [],
    [],
    []
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: AuthService,
    private msg: MessageService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnDestroy(): void { this.revokePreviewUrl(); }

  // ======================
  // INIT
  // ======================
  ngOnInit(): void {

    this.patientId = this.route.snapshot.queryParamMap.get('id');

    if (this.patientId) this.isEdit = true;

    if (this.route.snapshot.queryParamMap.get('view') === 'true') {
      this.isView = true;
    }

    this.clinicData = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');


    this.patientForm = this.fb.group({
      // Personal Info
      title:              [''],
      firstName:          ['', Validators.required],
      middleName:         [''],
      lastName:           ['', Validators.required],
      suffix:             [''],
      gender:             ['', Validators.required],
      dob:                [''],
      age:                [''],
      maritalStatus:      [''],

      // Contact
      phone:              ['', Validators.required],
      email:              [''],
      whatsappNumber:     [''],
      otherMobile:        [''],
      workEmail:          [''],
      landlineNumber:     [''],
      areaCode:           [''],
      emergencyContactName:   [''],
      emergencyContactNumber: [''],
      spouseName:             [''],
      spouseContactNumber:    [''],
      generalPractitioner:    [''],

      // Address
      address1:           [''],
      address2:           [''],
      address3:           [''],
      locality:           [''],
      city:               [''],
      state:              [''],
      country:            ['IN'],
      pincode:            [''],

      // Medical
      medicalAllergies:   [''],
      medicalConditions:  [[]],
      dentalConditions:   [[]],
      currentMedications: [''],
      allergicTo:         [''],
      habits:             [''],

      // Insurance
      insuranceCompany:    [''],
      insuranceSubCompany: [''],
      insurancePolicy:     [''],
      insuranceIdNumber:   [''],

      // Demographics
      language:    ['ENGLISH'],
      religion:    ['UNKNOWN'],
      occupation:  ['UNKNOWN'],
      ethnicGroup: [''],
      race:        [''],
      bloodGroup:  [''],
      discProfile: ['']
    });

    this.loadConditionOptions('MEDICAL');
    this.loadConditionOptions('DENTAL');

    this.loadInsuranceCompanies();

    if (this.isEdit) {
      this.loadPatient();
      this.loadPatientDocuments();
    }

    if (this.isView) this.patientForm.disable();

    this.routeItems = [
      { label: 'Personal Info', icon: 'pi pi-fw pi-user' },
      { label: 'Contact', icon: 'pi pi-fw pi-phone' },
      { label: 'Address', icon: 'pi pi-fw pi-home' },
      { label: 'Medical', icon: 'pi pi-fw pi-heart' },
      { label: 'Insurance', icon: 'pi pi-fw pi-shield' },
      { label: 'Demographics', icon: 'pi pi-fw pi-globe' }
    ];
  }

  // ======================
  // GETTER
  // ======================
  get f() {
    return this.patientForm.controls;
  }

  get patientDisplayName(): string {
    const patient = this.patientForm?.getRawValue?.() || {};
    return [patient.firstName, patient.middleName, patient.lastName]
      .filter(Boolean)
      .join(' ') || '—';
  }

  searchInsuranceCompanies(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.filteredInsuranceCompanies = this.insuranceCompanies.filter(company =>
      company.label.toLowerCase().includes(query)
    );
  }

  onInsuranceCompanySelect(event: any): void {
    const insurance = event.value;
    this.patientForm.patchValue({
      insuranceSubCompany: insurance.companyName || '',
      insurancePolicy: insurance.policyNumber || ''
    });
  }

  private loadConditionOptions(type: 'MEDICAL' | 'DENTAL'): void {
    this.api.getConditionList(type).subscribe({
      next: (response: any) => {
        const options = (response?.data || [])
          .filter((condition: any) => condition.status === 'ACTIVE')
          .map((condition: any) => ({ label: condition.name, value: condition.name }));
        if (type === 'MEDICAL') {
          this.medicalConditionOptions = options;
          this.includeExistingConditions(type, this.savedMedicalConditions);
        } else {
          this.dentalConditionOptions = options;
          this.includeExistingConditions(type, this.savedDentalConditions);
        }
      },
      error: () => {
        if (type === 'MEDICAL') this.medicalConditionOptions = [];
        else this.dentalConditionOptions = [];
      }
    });
  }

  private includeExistingConditions(type: 'MEDICAL' | 'DENTAL', values: string[] = []): void {
    if (type === 'MEDICAL') this.savedMedicalConditions = values;
    else this.savedDentalConditions = values;
    const options = type === 'MEDICAL' ? this.medicalConditionOptions : this.dentalConditionOptions;
    const extras = values
      .filter(value => !options.some(option => option.value === value))
      .map(value => ({ label: value.replace(/_/g, ' '), value }));
    if (type === 'MEDICAL') this.medicalConditionOptions = [...options, ...extras];
    else this.dentalConditionOptions = [...options, ...extras];
  }

  private loadInsuranceCompanies(): void {
    this.api.getInsuranceList().subscribe({
      next: (res: any) => {
        const records = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.insurances) ? res.data.insurances
          : Array.isArray(res) ? res
          : [];
        this.insuranceCompanies = records
          .filter((insurance: any) => insurance.insuranceCompany || insurance.insurerName)
          .filter((insurance: any, index: number, companies: any[]) => {
            const name = insurance.insuranceCompany || insurance.insurerName;
            return companies.findIndex(item =>
              (item.insuranceCompany || item.insurerName) === name
            ) === index;
          })
          .map((insurance: any) => ({
            label: insurance.insuranceCompany || insurance.insurerName,
            value: insurance.insuranceCompany || insurance.insurerName,
            companyName: insurance.companyName || insurance.company || '',
            policyNumber: insurance.policyNumber || ''
          }));
        this.filteredInsuranceCompanies = [...this.insuranceCompanies];
      },
      error: () => {
        this.insuranceCompanies = [];
        this.filteredInsuranceCompanies = [];
      }
    });
  }

  // ======================
  // TAB CHANGE
  // ======================
  onTabChange(event: any): void {
    this.activeTab = event.index;
  }

  hasTabErrors(tabIndex: number): boolean {
    return this.validationAttempted && this.requiredControlsByTab[tabIndex]
      .some(controlName => this.patientForm.get(controlName)?.invalid);
  }

  // ======================
  // DOB → AGE
  // ======================
  onDobSelect(date: Date): void {
    if (!date) {
      this.patientForm.patchValue({ age: null });
      return;
    }

    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    this.patientForm.patchValue({ age });
  }

  // ======================
  // SUBMIT
  // ======================
  onSubmit(): void {
    if (!this.validateRequiredFields()) return;
    this.isEdit ? this.updatePatient() : this.createPatient();
  }

  private validateRequiredFields(): boolean {
    if (this.patientForm.invalid) {
      this.validationAttempted = true;
      this.patientForm.markAllAsTouched();
      const firstInvalidTab = this.requiredControlsByTab.findIndex(controls =>
        controls.some(controlName => this.patientForm.get(controlName)?.invalid)
      );
      if (firstInvalidTab !== -1) this.activeTab = firstInvalidTab;
      return false;
    }
    return true;
  }

  bookAppointment(): void {
    if (this.patientId) {
      this.openAppointmentDialog();
      return;
    }

    if (!this.validateRequiredFields()) return;

    this.loading = true;
    const data = this.toPatientPayload();

    this.api.createPatient(data).subscribe({
      next: (res: any) => {
        this.patientId = res.data?.patient?._id || res.data?._id || null;
        this.success = 'Patient created successfully';
        this.msg.add({ severity: 'success', summary: 'Success', detail: this.success });
        if (this.patientId && this.selectedDocuments.length) {
          this.savePatientDocuments(this.patientId, () => {
            this.loading = false;
            this.openAppointmentDialog();
          });
        } else if (this.selectedDocuments.length) {
          this.loading = false;
          this.error = 'Patient saved, but the server did not return a patient ID for document upload.';
        } else {
          this.loading = false;
          this.openAppointmentDialog();
        }
      },
      error: err => this.handleError(err)
    });
  }

  openAppointmentDialog(): void {
    const firstName = this.patientForm.value.firstName || '';
    const lastName = this.patientForm.value.lastName || '';
    this.appointmentPatientName = `${firstName} ${lastName}`.trim();
    this.appointmentDialogVisible = true;
  }

  hideAppointmentDialog(): void {
    this.appointmentDialogVisible = false;
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
    this.documentsError = rejected.length
      ? 'Use JPG, PNG, PDF, SVG, DOC or DOCX files up to 24 MB.'
      : '';
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

  private savePatientDocuments(patientId: string, done: () => void): void {
    if (!this.selectedDocuments.length) {
      done();
      return;
    }
    this.documentsUploading = true;
    this.documentUploadProgress = 0;
    this.api.uploadPatientAttachments(patientId, this.selectedDocuments).subscribe({
      next: event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.documentUploadProgress = Math.round(event.loaded / event.total * 100);
        }
        if (event.type === HttpEventType.Response) {
          this.documentsUploading = false;
          this.selectedDocuments = [];
          this.loadPatientDocuments(patientId);
          done();
        }
      },
      error: err => {
        this.documentsUploading = false;
        this.loading = false;
        this.error = err?.error?.message || 'Patient saved, but document upload failed. Please retry from the Documents tab.';
        this.msg.add({ severity: 'error', summary: 'Upload failed', detail: this.error });
      }
    });
  }

  loadPatientDocuments(patientId = this.patientId): void {
    if (!patientId) return;
    this.documentsLoading = true;
    this.documentsListError = '';
    this.api.getPatientAttachments(patientId).subscribe({
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

  downloadPatientDocument(document: any): void {
    const id = document?._id || document?.id || document?.attachmentId;
    if (!this.patientId || !id) return;
    this.api.downloadPatientAttachment(this.patientId, id).subscribe({
      next: blob => this.saveDownloadedDocument(blob, this.documentName(document)),
      error: () => this.documentsListError = 'Could not download this document.'
    });
  }

  previewPatientDocument(file: any): void {
    const id = file?._id || file?.id || file?.attachmentId;
    if (!this.patientId || !id) return;
    this.previewingDocument = file; this.previewVisible = true; this.previewLoading = true; this.previewError = '';
    this.api.downloadPatientAttachment(this.patientId, id).subscribe({
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

  documentName(document: any): string {
    return document?.originalName || document?.originalname || document?.originalFilename ||
      document?.fileName || document?.filename || document?.name || 'Document';
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

  // ======================
  // CREATE
  // ======================
  createPatient(): void {
    if (!this.validateRequiredFields()) return;
    this.loading = true;

    // Patient records are independent; appointment booking is a separate optional flow.
    const data = this.toPatientPayload();

    this.api.createPatient(data).subscribe({
      next: (res: any) => {
        this.patientId = this.patientId || res?.data?.patient?._id || res?.data?._id || res?.patient?._id || null;
        if (!this.patientId && this.selectedDocuments.length) {
          this.loading = false;
          this.error = 'Patient saved, but the server did not return a patient ID for document upload.';
          return;
        }
        if (this.patientId) {
          this.savePatientDocuments(this.patientId, () => {
            this.success = 'Patient created successfully';
            this.msg.add({ severity: 'success', summary: 'Success', detail: this.success });
            this.afterSave();
          });
          return;
        }
        this.success = 'Patient created successfully';
        this.msg.add({ severity: 'success', summary: 'Success', detail: this.success });
        this.afterSave();
      },
      error: err => this.handleError(err)
    });
  }

  // ======================
  // UPDATE
  // ======================
  updatePatient(): void {
    if (!this.validateRequiredFields()) return;
    if (!this.patientId) return;
    this.loading = true;

    const data = this.toPatientPayload();

    this.api.updatePatient(this.patientId, data).subscribe({
      next: () => {
        this.savePatientDocuments(this.patientId!, () => {
          this.success = 'Patient updated successfully';
          this.msg.add({ severity: 'success', summary: 'Updated', detail: this.success });
          this.afterSave();
        });
      },
      error: err => this.handleError(err)
    });
  }

  // ======================
  // LOAD
  // ======================
  loadPatient(): void {
    this.loading = true;

    this.api.getPatientDetails(this.patientId!).subscribe({
      next: (res: any) => {
        const p = this.unwrapPatientRecord(res);

        if (p) {
          const medicalConditions = this.conditionValues(p.medicalConditions);
          const dentalConditions = this.conditionValues(p.dentalConditions);
          this.includeExistingConditions('MEDICAL', medicalConditions);
          this.includeExistingConditions('DENTAL', dentalConditions);
          this.patientForm.patchValue({
            title:              p.title,
            firstName:          p.firstName,
            middleName:         p.middleName,
            lastName:           p.lastName,
            suffix:             p.suffix,
            phone:              p.phone,
            email:              p.email,
            dob:                p.dob ? new Date(p.dob) : null,
            age:                p.age,
            gender:             p.gender,
            maritalStatus:      p.maritalStatus,

            whatsappNumber:     p.whatsappNumber,
            otherMobile:        p.otherMobile,
            workEmail:          p.workEmail,
            landlineNumber:     p.landlineNumber,
            areaCode:           p.areaCode,
            emergencyContactName:   p.emergencyContactName,
            emergencyContactNumber: p.emergencyContactNumber,
            spouseName:             p.spouseName,
            spouseContactNumber:    p.spouseContactNumber,
            generalPractitioner:    p.generalPractitioner,

            address1:         p.address1,
            address2:         p.address2,
            address3:         p.address3,
            locality:         p.locality,
            city:             p.city,
            state:            p.state,
            country:          p.country,
            pincode:          p.pincode,

            medicalAllergies:   p.medicalAllergies,
            medicalConditions,
            dentalConditions,
            currentMedications: p.currentMedications,
            allergicTo:         p.allergicTo,
            habits:             p.habits,

            insuranceCompany: this.insuranceCompanies.find(company =>
              company.value === p.insuranceCompany || company.label === p.insuranceCompany
            ) || (p.insuranceCompany ? { label: p.insuranceCompany, value: p.insuranceCompany } : null),
            insuranceSubCompany: p.insuranceSubCompany,
            insurancePolicy:     p.insurancePolicy,
            insuranceIdNumber:   p.insuranceIdNumber,

            language:    p.language,
            religion:    p.religion,
            occupation:  p.occupation,
            ethnicGroup: p.ethnicGroup,
            race:        p.race,
            bloodGroup:  p.bloodGroup,
            discProfile: p.discProfile
          });
        }

        this.loading = false;
      },
      error: err => this.handleError(err)
    });
  }

  private unwrapPatientRecord(response: any): any {
    let record = response;
    for (let depth = 0; depth < 4; depth++) {
      if (!record || typeof record !== 'object' || Array.isArray(record)) break;
      const nested = record.patient ?? record.data;
      if (!nested || nested === record) break;
      record = nested;
    }
    return record && !Array.isArray(record) ? record : null;
  }

  private conditionValues(values: any): string[] {
    if (!Array.isArray(values)) return [];
    return values.map(value => typeof value === 'string' ? value : value?.name || value?.value || '')
      .filter((value: string) => !!value);
  }

  private toPatientPayload(): any {
    const form = this.patientForm.getRawValue();
    return {
      ...form,
      insuranceCompany: form.insuranceCompany?.value || form.insuranceCompany || '',
    };
  }

  // Format ISO date → YYYY-MM-DD for date input
  formatDateForInput(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // ======================
  // HELPERS
  // ======================
  afterSave(): void {
    this.loading = false;
    setTimeout(() => this.router.navigate(['/pages/patient-list']), 1000);
  }

  handleError(err: any): void {
    this.loading = false;
    this.error = err?.error?.message || err?.message || 'Operation failed';
    this.msg.add({ severity: 'error', summary: 'Error', detail: this.error });
  }

  onCancel(): void {
    this.router.navigate(['/pages/patient-list']);
  }
}
