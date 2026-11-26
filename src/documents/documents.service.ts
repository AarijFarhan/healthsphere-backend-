import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { GeminiService } from '../gemini/gemini.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private gemini: GeminiService,
  ) {}

  async uploadDocument(patientId: string, file: Express.Multer.File) {
    if (!file?.buffer?.length) throw new BadRequestException('File is required');

    const resolvedPatientId = await this.resolvePatientId(patientId);
    const patient = await this.prisma.patient.findUnique({ where: { id: resolvedPatientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    let cloudinaryResult: any = null;
    let fileUrl: string;

    try {
      cloudinaryResult = await this.cloudinary.uploadFile(file);
      fileUrl = cloudinaryResult.secure_url;
    } catch {
      const uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      const storedName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${path.basename(file.originalname)}`;
      fs.writeFileSync(path.join(uploadDir, storedName), file.buffer);
      fileUrl = `/uploads/${storedName}`;
    }

    const doc = await this.prisma.uploadedDocument.create({
      data: {
        patientId: resolvedPatientId,
        fileName: file.originalname,
        fileUrl,
        cloudinaryId: cloudinaryResult?.public_id || null,
        ocrStatus: 'processing',
        documentType: this.detectDocType(file.mimetype, file.originalname),
        fileSize: file.size,
        mimeType: file.mimetype,
      },
    });

    this.processDocument(doc.id, file.buffer, file.mimetype, file.originalname).catch((err) => {
      this.logger.error(`OCR failed for document ${doc.id}:`, err);
    });

    return doc;
  }

  async runOcr(id: string) {
    const doc = await this.getDocument(id);
    const buffer = await this.loadFileBuffer(doc);
    return this.processDocument(doc.id, buffer, doc.mimeType || '', doc.fileName);
  }

  private async loadFileBuffer(doc: any): Promise<Buffer> {
    if (doc.fileUrl?.startsWith('/uploads/')) {
      const filePath = path.join(
        path.resolve(process.env.UPLOAD_DIR || 'uploads'),
        path.basename(doc.fileUrl),
      );
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
    }

    if (doc.fileUrl) {
      const response = await fetch(doc.fileUrl);
      if (!response.ok) throw new Error(`Unable to download document (${response.status})`);
      return Buffer.from(await response.arrayBuffer());
    }

    throw new Error('No file available for OCR');
  }

  private async processDocument(
    docId: string,
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ) {
    try {
      const doc = await this.getDocument(docId);
      const { text, confidence } = await this.extractText(buffer, mimeType, fileName);

      let aiSummary = '';
      if (this.gemini.isEnabled() && text) {
        try {
          aiSummary = await this.gemini.generateResponse(
            `Summarize this medical document and extract key medical findings: ${text.slice(0, 2000)}`,
          );
        } catch (err) {
          this.logger.warn('AI summary failed, OCR result kept:', err);
        }
      }

      const updated = await this.prisma.uploadedDocument.update({
        where: { id: docId },
        data: {
          ocrStatus: 'complete',
          extractedText: text || null,
          ocrConfidence: confidence,
          tags: this.extractTags(text),
        },
      });

      if (aiSummary) {
        await this.prisma.aIInsight.create({
          data: {
            patientId: doc.patientId,
            insightText: aiSummary.slice(0, 500),
            trendDirection: 'stable',
            severity: 'info',
            category: 'document-analysis',
            source: 'gemini-ocr-analysis',
            confidence: 0.85,
          },
        });
      }

      return updated;
    } catch (err) {
      await this.prisma.uploadedDocument
        .update({ where: { id: docId }, data: { ocrStatus: 'failed' } })
        .catch(() => undefined);
      throw err;
    }
  }

  private async extractText(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<{ text: string; confidence: number }> {
    if (mimeType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
      const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
      let text = '';
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        text += `${content.items.map((item: any) => item.str || '').join(' ')}\n`;
      }
      await pdf.destroy();
      text = text.trim();
      return { text, confidence: text ? 0.99 : 0 };
    }

    const Tesseract = require('tesseract.js');
    const result = await Tesseract.recognize(buffer, 'eng');
    const text = String(result?.data?.text || '').trim();
    const confidence = text ? Number(result?.data?.confidence || 80) / 100 : 0;
    return { text, confidence };
  }

  private async resolvePatientId(id: string): Promise<string> {
    if (process.env.DEMO_MODE !== 'true' || id !== 'patient-1-id') return id;
    const user = await this.prisma.user.findUnique({ where: { email: 'patient@demo.com' } });
    if (!user) return id;
    const patient = await this.prisma.patient.findUnique({ where: { userId: user.id } });
    return patient?.id || id;
  }

  private detectDocType(mimeType: string, filename: string): string {
    if (mimeType.includes('pdf')) return 'PDF Document';
    if (mimeType.includes('image')) {
      const name = filename.toLowerCase();
      if (name.includes('xray') || name.includes('x-ray')) return 'X-Ray';
      if (name.includes('mri')) return 'MRI Scan';
      if (name.includes('ct')) return 'CT Scan';
      return 'Medical Image';
    }
    return 'Document';
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const patterns: Array<[RegExp, string]> = [
      [/diabetes|glucose|a1c|insulin/i, 'diabetes'],
      [/hypertens|blood pressure|bp/i, 'hypertension'],
      [/cholesterol|lipid|ldl|hdl/i, 'lipid'],
      [/prescription|medication|dose/i, 'medication'],
      [/x-ray|mri|ct scan|imaging/i, 'imaging'],
      [/surgery|procedure|operation/i, 'surgery'],
      [/allerg|reaction/i, 'allergy'],
    ];
    patterns.forEach(([regex, tag]) => {
      if (regex.test(text)) tags.push(tag);
    });
    return tags;
  }

  async getDocument(id: string) {
    const doc = await this.prisma.uploadedDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async getPatientDocuments(patientId: string) {
    const resolvedPatientId = await this.resolvePatientId(patientId);
    return this.prisma.uploadedDocument.findMany({
      where: { patientId: resolvedPatientId },
      orderBy: { uploadDate: 'desc' },
    });
  }

  async deleteDocument(id: string) {
    const doc = await this.getDocument(id);
    if (doc.cloudinaryId) {
      try { await this.cloudinary.deleteFile(doc.cloudinaryId); } catch {}
    }
    if (doc.fileUrl?.startsWith('/uploads/')) {
      const filePath = path.join(
        path.resolve(process.env.UPLOAD_DIR || 'uploads'),
        path.basename(doc.fileUrl),
      );
      try { fs.unlinkSync(filePath); } catch {}
    }
    return this.prisma.uploadedDocument.delete({ where: { id } });
  }
}
