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
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/pagination/pagination.dto';

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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPatientDocuments(@Param('patientId') patientId: string, @Query() pagination: PaginationDto) {
    return this.documentsService.getPatientDocuments(patientId, pagination);
  }

  @Delete('documents/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }
}
