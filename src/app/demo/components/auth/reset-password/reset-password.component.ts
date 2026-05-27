import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from 'src/app/demo/service/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: false,
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {

  form!: FormGroup;
  token: string = '';
  loading = false;
  message = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // ✅ Get token from URL
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    // ✅ Form
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  // ✅ Submit
  onSubmit() {
  if (this.form.invalid) return;

  const { password, confirmPassword } = this.form.value;

  // ✅ Validate match
  if (password !== confirmPassword) {
    this.error = 'Passwords do not match';
    return;
  }

  this.loading = true;
  this.error = '';
  this.message = '';

  const data = {
    token: this.token, // ✅ FIXED
    newPassword: password
  };

  this.authService.resetPassword(data).subscribe({
    next: (res: any) => {
      this.message = res.message || 'Password reset successful';
      this.loading = false;
    },
    error: (err) => {
      this.error = err?.error?.message || 'Something went wrong';
      this.loading = false;
    }
  });
}
}