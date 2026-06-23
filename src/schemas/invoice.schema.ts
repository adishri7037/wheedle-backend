import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class InvoiceItem {
  @Prop()
  description: string;

  @Prop()
  qty: number;

  @Prop()
  rate: number;
}

export const InvoiceItemSchema = SchemaFactory.createForClass(InvoiceItem);

@Schema({ timestamps: true })
export class Invoice extends Document {
  @Prop({ required: true })
  invoiceNumber: string;

  @Prop({ required: true })
  date: string;

  @Prop()
  billTo: string;

  @Prop()
  subject: string;

  @Prop({ type: [InvoiceItemSchema], default: [] })
  items: InvoiceItem[];

  @Prop()
  gstPercentage: number;

  @Prop()
  subTotal: number;

  @Prop()
  gstAmount: number;

  @Prop()
  totalAmount: number;
}

export const InvoiceSchema = SchemaFactory.createForClass(Invoice);
