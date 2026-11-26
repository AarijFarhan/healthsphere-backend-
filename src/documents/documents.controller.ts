import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Documents')
@Controller()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('patients/:patientId/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadDocument(
    @Param('patientId') patientId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.documentsService.uploadDocument(patientId, file);
  }

  @Get('documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getDocument(@Param('id') id: string) {
    return this.documentsService.getDocument(id);
  }

  @Post('documents/:id/ocr')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  runOcr(@Param('id') id: string) {
    return this.documentsService.runOcr(id);
  }

  @Get('patients/:patientId/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getPatientDocuments(@Param('patientId') patientId: string) {
    return this.documentsService.getPatientDocuments(patientId);
  }

  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }
}
