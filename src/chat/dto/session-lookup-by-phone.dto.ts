import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class SessionLookupByPhoneDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'Phone must contain digits only.' })
  @Length(10, 15)
  phone!: string;
}

