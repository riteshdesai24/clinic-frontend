import { Component, ElementRef, ViewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LayoutService } from "./service/app.layout.service";

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
export class AppTopBarComponent {

    items!: MenuItem[];
    clinicName: string = '';

    @ViewChild('menubutton') menuButton!: ElementRef;

    @ViewChild('topbarmenubutton') topbarMenuButton!: ElementRef;

    @ViewChild('topbarmenu') menu!: ElementRef;

    constructor(public layoutService: LayoutService) {
        this.clinicName = localStorage.getItem('clinicname') || sessionStorage.getItem('clinicname') || 'My Clinic';
    }
}
