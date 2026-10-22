import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  profile: any;
  fields: string[] = [];
  loading = true;
  saving = false;
  savingPassword = false;
  clinicLogo = '';
  logoError = '';

  private readonly editableFields: Record<string, string[]> = {
    ADMIN: ['clinicName', 'phone', 'email'],
    STAFF: ['staffname', 'phone', 'email'],
    DOCTOR: ['staffname', 'phone', 'email', 'specialization']
  };

  constructor(
    private fb: FormBuilder,
    private api: AuthService,
    private msg: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const strongPassword = Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/);
    this.passwordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, strongPassword]],
      confirmPassword: ['', Validators.required]
    });
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.api.getCurrentProfile().subscribe({
      next: (response: any) => {
        this.profile = response?.data || {};
        this.clinicLogo = this.profile.clinicLogo || this.profile.logoUrl || this.profile.logo || this.readClinicLogo();
        this.fields = this.editableFields[this.profile.role] || [];
        const controls: Record<string, any> = {};
        this.fields.forEach(field => {
          const validators = field === 'email' || field === 'clinicName' || field === 'staffname'
            ? [Validators.required]
            : [];
          if (field === 'email') validators.push(Validators.email);
          controls[field] = [this.profile[field] || '', validators];
        });
        this.profileForm = this.fb.group(controls);
        this.loading = false;
      },
      error: (error: any) => {
        this.loading = false;
        this.msg.add({ severity: 'error', summary: 'Profile unavailable', detail: error?.error?.message || 'Unable to load your profile.' });
      }
    });
  }

  save(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.saving = true;
    const changes = { ...this.profileForm.getRawValue(), clinicLogo: this.clinicLogo };
    this.api.updateCurrentProfile(changes).subscribe({
      next: (response: any) => {
        this.profile = { ...this.profile, ...changes, ...(response?.data || {}) };
        this.persistProfile();
        this.saving = false;
        this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Your profile has been updated.' });
      },
      error: (error: any) => {
        this.saving = false;
        this.msg.add({ severity: 'error', summary: 'Could not save', detail: error?.error?.message || 'Unable to update your profile.' });
      }
    });
  }

  onClinicLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    this.logoError = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|gif|webp|svg\+xml)$/.test(file.type) || file.size > 10 * 1024 * 1024) {
      this.logoError = 'Choose an SVG, PNG, JPEG, GIF, or WebP image under 10 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 600 / image.width, 300 / image.height);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext('2d');
        if (!context) { this.logoError = 'Could not prepare this image. Please try another file.'; return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        this.clinicLogo = canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.86);
      };
      image.onerror = () => { this.logoError = 'Could not read this image. Please try another file.'; };
      image.src = String(reader.result || '');
    };
    reader.onerror = () => { this.logoError = 'Could not read this image. Please try another file.'; };
    reader.readAsDataURL(file);
  }

  removeClinicLogo(): void { this.clinicLogo = ''; this.logoError = ''; }

  private readClinicLogo(): string {
    try {
      const clinic = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');
      return clinic.clinicLogo || clinic.logoUrl || clinic.logo || '';
    } catch { return ''; }
  }

  cancel(): void {
    this.router.navigate(['/']);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();
    if (newPassword !== confirmPassword) {
      this.passwordForm.get('confirmPassword')?.setErrors({ mismatch: true });
      return;
    }
    this.savingPassword = true;
    this.api.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.msg.add({ severity: 'success', summary: 'Password updated', detail: 'Your password has been changed.' });
      },
      error: (error: any) => {
        this.savingPassword = false;
        this.msg.add({ severity: 'error', summary: 'Could not update password', detail: error?.error?.message || 'Unable to change your password.' });
      }
    });
  }

  label(field: string): string {
    return field === 'staffname' ? 'Name' : field.replace(/([A-Z])/g, ' $1').replace(/^./, value => value.toUpperCase());
  }

  private persistProfile(): void {
    const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
    try {
      const user = JSON.parse(storage.getItem('user') || '{}');
      storage.setItem('user', JSON.stringify({ ...user, ...this.profile }));
      const clinicStorage = localStorage.getItem('clinic') ? localStorage : sessionStorage;
      const clinic = JSON.parse(clinicStorage.getItem('clinic') || '{}');
      clinicStorage.setItem('clinic', JSON.stringify({
        ...clinic,
        ...(this.profile.role === 'ADMIN' ? { clinicName: this.profile.clinicName } : {}),
        clinicLogo: this.clinicLogo
      }));
      window.dispatchEvent(new Event('clinic-profile-updated'));
    } catch {
      // The server profile remains authoritative if old browser storage is malformed.
    }
  }
}
