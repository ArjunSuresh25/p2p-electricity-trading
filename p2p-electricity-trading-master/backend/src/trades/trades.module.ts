import { Module } from '@nestjs/common';
import { TradesService } from './trades.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TradesController } from './trades.controller';
import { EventsGateway } from 'src/events/events.gateway';

@Module({
  providers: [TradesService, PrismaService, EventsGateway],
  controllers: [TradesController],
})
export class TradesModule {}
