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
    this.api.updateCurrentProfile(this.profileForm.getRawValue()).subscribe({
      next: (response: any) => {
        this.profile = response?.data || { ...this.profile, ...this.profileForm.getRawValue() };
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
      if (this.profile.role === 'ADMIN') {
        const clinicStorage = localStorage.getItem('clinic') ? localStorage : sessionStorage;
        const clinic = JSON.parse(clinicStorage.getItem('clinic') || '{}');
        clinicStorage.setItem('clinic', JSON.stringify({ ...clinic, clinicName: this.profile.clinicName }));
      }
    } catch {
      // The server profile remains authoritative if old browser storage is malformed.
    }
  }
}
