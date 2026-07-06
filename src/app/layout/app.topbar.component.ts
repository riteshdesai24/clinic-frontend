import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";
import { Router } from '@angular/router';

@Component({
    selector: 'app-topbar',
    templateUrl: './app.topbar.component.html',
    styles: [`
        :host ::ng-deep .layout-topbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            padding: 0 !important;
            margin: 0 !important;
        }
    `]
})
export class AppTopBarComponent implements OnInit {

    items!: MenuItem[];
    clinicName: string = '';
    menuItems: MenuItem[] = [];
    userData: any = {};
    clinicData: any = {};

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService, private router: Router) {
        // this.clinicName = localStorage.getItem('clinicname') || sessionStorage.getItem('clinicname') || 'My Clinic';
    }

    ngOnInit() {
        this.userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        this.clinicData = JSON.parse(localStorage.getItem('clinic') || sessionStorage.getItem('clinic') || '{}');
        if (this.userData.role != 'ADMIN') {
            this.clinicName = this.clinicData.clinicName || 'My Clinic';
        } else {
            this.clinicName = this.userData.clinicName || 'My Clinic';
        }
        this.menuItems = [
            {
                label: 'Profile', icon: 'pi pi-fw pi-user'
            },
            {
                separator: true
            },
            {
                label: 'LogOut', icon: 'pi pi-fw pi-home', command: () => this.logout()
            },
        ];
    }

    logout() {
        // Clear storage (important)
        localStorage.clear();
        sessionStorage.clear();

        // Navigate to login page
        this.router.navigate(['/auth/login']);
    }
}
