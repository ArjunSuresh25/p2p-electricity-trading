import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TradesModule } from './trades/trades.module';
import { PrismaModule } from './prisma/prisma.module';
import { EventsGateway } from './events/events.gateway';

@Module({
  imports: [AuthModule, UsersModule, TradesModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
