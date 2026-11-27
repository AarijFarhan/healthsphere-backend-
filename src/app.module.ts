import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { GeminiModule } from './gemini/gemini.module';
import { HuggingFaceModule } from './huggingface/huggingface.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { CliniciansModule } from './clinicians/clinicians.module';
import { RecordsModule } from './records/records.module';
import { LabsModule } from './labs/labs.module';
import { InsightsModule } from './insights/insights.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { DocumentsModule } from './documents/documents.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MedicationsModule } from './medications/medications.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { AdminModule } from './admin/admin.module';
import { FacilitiesModule } from './facilities/facilities.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    CloudinaryModule,
    GeminiModule,
    HuggingFaceModule,
    AuthModule,
    PatientsModule,
    CliniciansModule,
    RecordsModule,
    LabsModule,
    InsightsModule,
    AppointmentsModule,
    DocumentsModule,
    ReportsModule,
    NotificationsModule,
    MedicationsModule,
    SymptomsModule,
    AdminModule,
    FacilitiesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
