import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/strategies/jwt/jwt-auth.guard';
import { TradesService } from './trades.service';
import { ApiTags } from '@nestjs/swagger';
import { EventsGateway } from 'src/events/events.gateway';

@ApiTags('Trade')
@Controller('trades')
export class TradesController {
  constructor(
    private tradesService: TradesService,
    private eventsGateway: EventsGateway,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('trade')
  getTradeByID(@Request() req, @Query() query) {
    const { userId } = req.user;
    const tradeId = query.tradeId;
    return this.tradesService.getTradesByID(userId, tradeId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getTrades(@Request() req) {
    const { userId } = req.user;
    return this.tradesService.getTradesByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/available')
  getAvailableTrades(@Request() req) {
    const { userId } = req.user;
    return this.tradesService.getAvailableTradesNotMatchingUser(userId);
  }

  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @Post()
  createTrade(@Request() req, @Body() createTradeDto: any) {
    const { userId } = req.user;
    setTimeout(() => this.eventsGateway.broadcastUpdateTradesEvent(), 100);
    return this.tradesService.createTrade({
      price: createTradeDto.price,
      quantity: createTradeDto.quantity,
      [createTradeDto.type === 'buy' ? 'buyerId' : 'sellerId']: userId,
    });
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Put('/cancel/:tradeId')
  async cancelTrade(@Request() req, @Param('tradeId') tradeId) {
    const { userId } = req.user;
    if ((await this.tradesService.cancelTrade(tradeId, userId)).count !== 1)
      throw new ForbiddenException();
    setTimeout(() => this.eventsGateway.broadcastUpdateTradesEvent(), 100);
    return { message: 'OK' };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Put('/accept-buy/:tradeId')
  async executeBuy(@Request() req, @Param('tradeId') tradeId) {
    const { userId } = req.user;
    if ((await this.tradesService.acceptBuy(tradeId, userId)).count !== 1)
      throw new ForbiddenException();
    setTimeout(() => this.eventsGateway.broadcastUpdateTradesEvent(), 100);
    return { message: 'OK' };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Put('/accept-sell/:tradeId')
  async executeSell(@Request() req, @Param('tradeId') tradeId) {
    const { userId } = req.user;
    if ((await this.tradesService.acceptSell(tradeId, userId)).count !== 1)
      throw new ForbiddenException();
    setTimeout(() => this.eventsGateway.broadcastUpdateTradesEvent(), 100);
    return { message: 'OK' };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Put('/start-transfer/:tradeId')
  async startTransfer(@Request() req, @Param('tradeId') tradeId) {
    const { userId } = req.user;
    this.eventsGateway.startTransfer(tradeId, 10);
    return { message: 'OK' };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Put('/complete/:tradeId')
  async conpleteTrade(@Request() req, @Param('tradeId') tradeId) {
    const { userId } = req.user;
    await this.tradesService.completeTrade(tradeId, userId);
    return { message: 'OK' };
  }
}
