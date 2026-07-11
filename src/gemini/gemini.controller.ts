import {
  Controller, Get, Post, Param, Body, Query, UseGuards, Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('AI Assistant')
@Controller('ai')
export class GeminiController {
  constructor(
    private geminiService: GeminiService,
    private prisma: PrismaService,
  ) {}

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async chat(@Req() req: any, @Body() body: { message: string; sessionId?: string }) {
    let sessionId = body.sessionId;

    if (!sessionId) {
      const session = await this.prisma.aIChatSession.create({
        data: { userId: req.user.sub, title: body.message.slice(0, 60) },
      });
      sessionId = session.id;
    }

    await this.prisma.aIChatMessage.create({
      data: { sessionId, role: 'user', content: body.message },
    });

    // Get conversation history
    const history = await this.prisma.aIChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    const reply = await this.geminiService.chatWithHistory(history);

    await this.prisma.aIChatMessage.create({
      data: { sessionId, role: 'assistant', content: reply },
    });

    return { sessionId, reply };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getSessions(@Req() req: any) {
    return this.prisma.aIChatSession.findMany({
      where: { userId: req.user.sub },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  @Get('sessions/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMessages(@Param('id') id: string) {
    return this.prisma.aIChatMessage.findMany({
      where: { sessionId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post('analyze-labs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async analyzeLabs(@Body() body: { labResults: any[] }) {
    const analysis = await this.geminiService.analyzeLabReport(body.labResults);
    return { analysis };
  }

  @Get('health-advice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async healthAdvice(@Req() req: any, @Query('topic') topic: string) {
    const response = await this.geminiService.generateResponse(
      `Give me personalized health advice about: ${topic || 'general wellness'}`,
    );
    return { advice: response };
  }
}
