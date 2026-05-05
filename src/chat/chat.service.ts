import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { Chat } from '../schemas/chat.schema';
import { UserContact } from '../schemas/user-contact.schema';
import * as fs from 'fs';
import * as path from 'path';

// @ts-ignore
const pdf = require('pdf-parse');

const GREETING_WORDS = {
  hi: 'Hi Welcome to Wheedle Technologies! How can I help you today?',
  hello: 'Hello Great to see you! How may I assist you?',
  hey: 'Hey there How can I support you today?',
  'how are you': "I'm doing great! How can I assist you today?",
  'good morning': 'Good Morning How can I help you today?',
  'good afternoon': 'Good Afternoon How may I assist you?',
  'good evening': 'Good Evening How can I support you today?',
  bye: 'Goodbye Have a wonderful day!',
};

const CONTACT_DETAILS = {
  full_contact: `📞 Phone: +91 9717672561
📧 Email: info@wheedletechnologies.ai
📍 Address: Sector 62, ITHM Tower, Tower C, Office No. 410`,
};

const SERVICES = [
  { name: 'AI Web Engineering Agents', url: 'https://wheedletechnologies.ai/service/ai-web-engineering-agents' },
  { name: 'Software Development Agentic Platform', url: 'https://wheedletechnologies.ai/service/software-development-agentic-platform' },
  { name: 'Autonomous Digital Marketing Agents', url: 'https://wheedletechnologies.ai/service/autonomous-digital-marketing-agents' },
  { name: 'Autonomous UI/UX Design', url: 'https://wheedletechnologies.ai/service/autonomous-ui/ux-design-intelligence' },
  { name: 'AI App Development Agent', url: 'https://wheedletechnologies.ai/service/ai-app-development-agent' },
  { name: 'Autonomous IT Consulting & Advisory Agent', url: 'https://wheedletechnologies.ai/service/autonomous-it-consulting-and-advisory-agent' },
  { name: 'AI Graphic Design Automation Agent', url: 'https://wheedletechnologies.ai/service/ai-graphic-design-automation-agent' },
  { name: 'AI Solutions & Intelligent Automation', url: 'https://wheedletechnologies.ai/service/ai-solutions-and-intelligent-automation' },
];

@Injectable()
export class ChatService implements OnModuleInit {
  private openai: OpenAI;
  private userQuestionCount = new Map<string, number>();
  private waitingForContact = new Map<string, boolean>();
  private readonly MAX_QUESTIONS = 4;
  private pdfContent = '';

  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(UserContact.name) private contactModel: Model<UserContact>,
    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async onModuleInit() {
    try {
      const pdfPath = path.join(process.cwd(), 'Wheedle Technologies pdf.pdf');
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdf(dataBuffer);
      this.pdfContent = data.text;
    } catch (e) {
      console.error('PDF Loading Error:', e);
    }
  }

  async getChatHistory(sessionId: string) {
    return this.chatModel.find({ sessionId }).sort({ createdAt: 1 }).exec();
  }

  async saveMessage(sessionId: string, role: string, message: string, userId?: string) {
    const newChat = new this.chatModel({ sessionId, role, message, userId });
    return newChat.save();
  }

  async askAI(sessionId: string, message: string, userId?: string, ip?: string) {
    const msgLower = message.toLowerCase().trim();

    // Check if waiting for contact
    if (this.waitingForContact.get(ip || 'default')) {
      const parts = message.split(' ');
      if (parts.length >= 2) {
        await new this.contactModel({
          email: parts[0],
          phone: parts[1],
          ip: ip || 'unknown',
        }).save();
        this.waitingForContact.set(ip || 'default', false);
        return { response: 'Thank you! Your contact details have been saved. Our team will contact you soon.' };
      }
      return { response: 'Please send Email and Phone Number like:\nexample@email.com 9876543210' };
    }

    // Question limit
    const count = this.userQuestionCount.get(ip || 'default') || 0;
    if (count >= this.MAX_QUESTIONS) {
      this.waitingForContact.set(ip || 'default', true);
      return { response: 'To assist you further, please share your Email ID and Phone Number. Our team will get in touch with you shortly.' };
    }

    // Static responses
    if (GREETING_WORDS[msgLower]) {
      this.userQuestionCount.set(ip || 'default', count + 1);
      return { response: GREETING_WORDS[msgLower] };
    }

    if (msgLower.includes('contact')) {
      this.userQuestionCount.set(ip || 'default', count + 1);
      return { response: CONTACT_DETAILS.full_contact };
    }

    if (msgLower.includes('service')) {
      let serviceList = 'Here are the services offered by Wheedle Technologies:\n\n';
      SERVICES.forEach((s) => {
        serviceList += `• ${s.name}\n`;
      });
      return { response: serviceList };
    }

    // OpenAI response with specific Wheedle rules
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `
You are the official AI assistant of Wheedle Technologies.

Rules:
- Answer ONLY about Wheedle Technologies.
- Keep answers SHORT (2–5 lines max).

Company Information:
${this.pdfContent.substring(0, 8000)}
`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
      max_tokens: 150,
    });

    const assistantMessage = response.choices[0].message.content || '';

    this.userQuestionCount.set(ip || 'default', count + 1);

    return { response: assistantMessage };
  }
}
