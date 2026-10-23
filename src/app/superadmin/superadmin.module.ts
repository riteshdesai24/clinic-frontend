import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { SuperAdminLoginComponent } from './superadmin-login.component';
import { SuperAdminRegisterComponent } from './superadmin-register.component';
import { SuperAdminDashboardComponent } from './superadmin-dashboard.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: SuperAdminLoginComponent },
  { path: 'register', component: SuperAdminRegisterComponent },
  { path: 'dashboard', pathMatch: 'full', redirectTo: 'clinics' },
  { path: 'clinics', component: SuperAdminDashboardComponent, data: { resource: 'clinics' } },
  { path: 'countries', component: SuperAdminDashboardComponent, data: { resource: 'countries' } },
  { path: 'states', component: SuperAdminDashboardComponent, data: { resource: 'states' } },
  { path: 'cities', component: SuperAdminDashboardComponent, data: { resource: 'cities' } },
  { path: 'memberships', component: SuperAdminDashboardComponent, data: { resource: 'memberships' } },
  { path: 'treatmentmasters', component: SuperAdminDashboardComponent, data: { resource: 'treatmentmasters' } },
  { path: 'labmasters', component: SuperAdminDashboardComponent, data: { resource: 'labmasters' } }
];

@NgModule({
  declarations: [SuperAdminLoginComponent, SuperAdminRegisterComponent, SuperAdminDashboardComponent],
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, InputTextareaModule, RouterModule.forChild(routes)]
})
export class SuperAdminModule {}
