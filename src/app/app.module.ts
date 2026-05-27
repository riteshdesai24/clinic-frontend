import { NgModule } from '@angular/core';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { TokenInterceptor } from './core/token.interceptor';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutModule } from './layout/app.layout.module';
import { NotfoundComponent } from './demo/components/notfound/notfound.component';
import { ProductService } from './demo/service/product.service';
import { CountryService } from './demo/service/country.service';
import { CustomerService } from './demo/service/customer.service';
import { EventService } from './demo/service/event.service';
import { IconService } from './demo/service/icon.service';
import { NodeService } from './demo/service/node.service';
import { PhotoService } from './demo/service/photo.service';
import { MessageService } from 'primeng/api';
import { MenusModule } from './demo/components/uikit/menus/menus.module';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { StepsModule } from 'primeng/steps';
import { TabMenuModule } from 'primeng/tabmenu';
import { TieredMenuModule } from 'primeng/tieredmenu';

@NgModule({
    declarations: [
        AppComponent, NotfoundComponent
    ],
    imports: [
        AppRoutingModule,
        AppLayoutModule,
        HttpClientModule,
        MenusModule,
        MenubarModule,
        TabMenuModule,
        StepsModule,
        TieredMenuModule,
        MenuModule,
    ],
    providers: [
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: HTTP_INTERCEPTORS, useClass: TokenInterceptor, multi: true },
        CountryService, CustomerService, EventService, IconService, NodeService,
        PhotoService, ProductService,MessageService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
