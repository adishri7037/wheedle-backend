export class FindByPhoneResponseSessionDto {
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessage: string;
}

export class FindByPhoneResponseDto {
  success: boolean;
  message?: string;
  sessions?: FindByPhoneResponseSessionDto[];
}

