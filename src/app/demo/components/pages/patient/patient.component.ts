import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html',
  styleUrls: ['./patient.component.scss']
})
export class PatientComponent implements OnInit {

  patientForm!: FormGroup;

  loading = false;
  error: string | null = null;
  success: string | null = null;

  clinicId = '';

  isEdit = false;
  isView = false;

  patientId: string | null = null;
  appointmentDialogVisible = false;
  appointmentPatientName = '';

  // ---------- Personal Info ----------
  titles = [
    { label: 'Mr', value: 'MR' },
    { label: 'Mrs', value: 'MRS' },
    { label: 'Ms', value: 'MS' },
    { label: 'Dr', value: 'DR' },
    { label: 'Master', value: 'MASTER' }
  ];

  // NOTE [Guessing]: reference screen shows Male / Female / Transgender / Unknown as radio options.
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
  // NOTE [Guessing]: trimmed sample list — replace with your actual state master data.
  states = [
    { label: 'Maharashtra', value: 'MH' },
    { label: 'Delhi', value: 'DL' },
    { label: 'Karnataka', value: 'KA' },
    { label: 'Tamil Nadu', value: 'TN' }
  ];

  countries = [
    { label: 'India', value: 'IN' },
    { label: 'United States', value: 'US' },
    { label: 'United Kingdom', value: 'UK' }
  ];

  // ---------- Medical ----------
  // NOTE [Guessing]: option labels copied verbatim from your screenshot chips.
  medicalConditionOptions = [
    { label: 'Heart Diseases', value: 'HEART_DISEASES' },
    { label: 'High/Low Blood Pressure', value: 'BLOOD_PRESSURE' },
    { label: 'Asthma', value: 'ASTHMA' },
    { label: 'Tuberculosis', value: 'TUBERCULOSIS' },
    { label: 'Peptic Ulcer / Acidity', value: 'PEPTIC_ULCER' },
    { label: 'Diabetes', value: 'DIABETES' },
    { label: 'Anaemia', value: 'ANAEMIA' },
    { label: 'Thalassaemia', value: 'THALASSAEMIA' },
    { label: 'Kidney Diseases', value: 'KIDNEY_DISEASES' },
    { label: 'Hemophilia', value: 'HEMOPHILIA' },
    { label: 'Convulsions / Epilepsy', value: 'CONVULSIONS_EPILEPSY' },
    { label: 'Psychiatric Problem', value: 'PSYCHIATRIC_PROBLEM' },
    { label: 'AIDS / HIV', value: 'AIDS_HIV' },
    { label: 'Jaundice / Hepatitis', value: 'JAUNDICE_HEPATITIS' },
    { label: 'Rheumatic Fever', value: 'RHEUMATIC_FEVER' },
    { label: 'Pregnancy', value: 'PREGNANCY' },
    { label: 'Breast-feeding', value: 'BREAST_FEEDING' }
  ];

  dentalConditionOptions = [
    { label: 'Bad Breath', value: 'BAD_BREATH' },
    { label: 'Bleeding gums', value: 'BLEEDING_GUMS' },
    { label: 'Sensitivity', value: 'SENSITIVITY' },
    { label: 'Discoloured teeth', value: 'DISCOLOURED_TEETH' },
    { label: 'Stained teeth', value: 'STAINED_TEETH' },
    { label: 'Fractured teeth', value: 'FRACTURED_TEETH' },
    { label: 'Missing teeth', value: 'MISSING_TEETH' },
    { label: 'Cracked teeth', value: 'CRACKED_TEETH' },
    { label: 'Dry Mouth', value: 'DRY_MOUTH' },
    { label: 'Pus', value: 'PUS' },
    { label: 'Tooth Wear', value: 'TOOTH_WEAR' },
    { label: 'Loose Teeth', value: 'LOOSE_TEETH' },
    { label: 'Loose Gums', value: 'LOOSE_GUMS' },
    { label: 'Infection', value: 'INFECTION' },
    { label: 'Extra Teeth', value: 'EXTRA_TEETH' },
    { label: 'Crooked Bite', value: 'CROOKED_BITE' },
    { label: 'Oral Thrush', value: 'ORAL_THRUSH' },
    { label: 'Teeth Grinding', value: 'TEETH_GRINDING' },
    { label: 'Jaw Joint Problems (TMJ)', value: 'JAW_JOINT_TMJ' },
    { label: 'Oral Cancer (Early Signs)', value: 'ORAL_CANCER_EARLY' },
    { label: 'Receding Gums', value: 'RECEDING_GUMS' },
    { label: 'Mouth Sores', value: 'MOUTH_SORES' }
  ];

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private api: AuthService,
    private msg: MessageService
  ) {}

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

    this.clinicId = this.clinicData._id || '';

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

    this.loadInsuranceCompanies();

    if (this.isEdit) this.loadPatient();

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

  private loadInsuranceCompanies(): void {
    if (!this.clinicId) {
      return;
    }

    this.api.getInsuranceList(this.clinicId).subscribe({
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
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    this.isEdit ? this.updatePatient() : this.createPatient();
  }

  bookAppointment(): void {
    if (this.patientId) {
      this.openAppointmentDialog();
      return;
    }

    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const data = this.toPatientPayload();

    this.api.createPatient(data).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.patientId = res.data?.patient?._id || res.data?._id || null;
        this.success = 'Patient created successfully';
        this.msg.add({ severity: 'success', summary: 'Success', detail: this.success });
        this.openAppointmentDialog();
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

  // ======================
  // CREATE
  // ======================
  createPatient(): void {
    this.loading = true;

    const data = this.toPatientPayload();

    this.api.createPatient(data).subscribe({
      next: () => {
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
    if (!this.patientId) return;
    this.loading = true;

    const data = this.toPatientPayload();

    this.api.updatePatient(this.patientId, data).subscribe({
      next: () => {
        this.success = 'Patient updated successfully';
        this.msg.add({ severity: 'success', summary: 'Updated', detail: this.success });
        this.afterSave();
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
        const p = res.data.patient;

        if (p) {
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
            medicalConditions:  p.medicalConditions,
            dentalConditions:   p.dentalConditions,
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

  private toPatientPayload(): any {
    const form = this.patientForm.getRawValue();
    return {
      ...form,
      insuranceCompany: form.insuranceCompany?.value || form.insuranceCompany || '',
      clinicId: this.clinicId
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
