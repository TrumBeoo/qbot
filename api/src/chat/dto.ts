import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  // Ban cu cho tao hoi thoai kem luon cap tin nhan dau tien
  // (be/repositories/mysql_chat_blueprint.py duong 14).
  @IsOptional()
  @IsString()
  user_message?: string;

  @IsOptional()
  @IsString()
  bot_response?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

export class UpdateConversationDto {
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(500)
  title: string;
}

export class AddMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message text is required' })
  text: string;

  @IsIn(['user', 'bot'], { message: 'sender must be user or bot' })
  sender: 'user' | 'bot';

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

export class ListQueryDto {
  // Query string luon la chuoi; @Type ep sang so truoc khi validate.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number;
}

export class SearchQueryDto extends ListQueryDto {
  // Ban cu doc tham so ten "q".
  @IsString()
  @IsNotEmpty({ message: 'Missing search query' })
  q: string;
}
