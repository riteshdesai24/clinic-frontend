import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

    constructor(private http: HttpClient) { }

    login(email: string, password: string): Observable<any> {
        const url = `${environment.apiUrl}/api/auth/login`;
        return this.http.post(url, { email, password });
    }

    register(name: string, email: string, phone: string, password: string, clinicName: string): Observable<any> {
        const url = `${environment.apiUrl}/api/auth/register`;
        return this.http.post(url, { name, email, phone, password, clinicName });
    }

    createStaff(staffname: string, email: string, phone: string, password: string, role: string, clinicId: string): Observable<any> {
        const url = `${environment.apiUrl}/api/staff`;
        return this.http.post(url, { staffname, email, phone, password, role, clinicId });
    }

    getStaffList(clinicId: string, cursor?: string | null, limit?: number): Observable<any> {
        let params = `?clinicId=${clinicId}`;
        if (cursor) params += `&cursor=${cursor}`;
        if (limit) params += `&limit=${limit}`;
        const url = `${environment.apiUrl}/api/staff${params}`;
        return this.http.get(url);
    }

    updateStaff(staffId: string, data: any): Observable<any> {
        const url = `${environment.apiUrl}/api/staff/${staffId}`;
        return this.http.put(url, data);
    }

    deleteStaff(staffId: string): Observable<any> {
        const url = `${environment.apiUrl}/api/staff/${staffId}`;
        return this.http.delete(url);
    }

    createDoctor(doctorname: string, email: string, phone: string, password: string, specialization: string, clinicId: string): Observable<any> {
        const url = `${environment.apiUrl}/api/doctors`;
        return this.http.post(url, { doctorname, email, phone, password, specialization, clinicId });
    }

    getDoctorList(clinicId: string, cursor?: string | null, limit?: number): Observable<any> {
        let params = `?clinicId=${clinicId}`;
        if (cursor) params += `&cursor=${cursor}`;
        if (limit) params += `&limit=${limit}`;
        const url = `${environment.apiUrl}/api/doctors${params}`;
        return this.http.get(url);
    }

    updateDoctor(doctorId: string, data: any): Observable<any> {
        const url = `${environment.apiUrl}/api/doctors/${doctorId}`;
        return this.http.put(url, data);
    }

    deleteDoctor(doctorId: string): Observable<any> {
        const url = `${environment.apiUrl}/api/doctors/${doctorId}`;
        return this.http.delete(url);
    }

}
