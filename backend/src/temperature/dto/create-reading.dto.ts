export class CreateReadingDto {
  deviceId: string;
  temperature: number;
  humidity?: number;
  readingTime?: Date;
}
