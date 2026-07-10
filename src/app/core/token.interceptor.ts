import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    constructor(private messageService: MessageService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const request = token
            ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
            : req;

        return next.handle(request).pipe(
            tap((event) => {
                if (event instanceof HttpResponse) {
                    const message = this.getSuccessMessage(event.body);
                    if (message) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: message
                        });
                    }
                }
            }),
            catchError((error: HttpErrorResponse) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: this.getErrorMessage(error)
                });
                return throwError(() => error);
            })
        );
    }

    private getSuccessMessage(body: any): string | null {
        return this.asMessage(body?.message) || this.asMessage(body?.data?.message);
    }

    private getErrorMessage(error: HttpErrorResponse): string {
        const body = error.error;
        return this.asMessage(body?.message)
            || this.asMessage(body?.error?.message)
            || this.asMessage(body?.error)
            || this.asMessage(body?.errors)
            || error.message
            || 'The request could not be completed.';
    }

    private asMessage(value: unknown): string | null {
        if (typeof value === 'string' && value.trim()) {
            return value;
        }

        if (Array.isArray(value)) {
            const messages = value
                .map((item) => typeof item === 'string' ? item : item?.message)
                .filter((item): item is string => typeof item === 'string' && !!item.trim());
            return messages.length ? messages.join(', ') : null;
        }

        return null;
    }
}
