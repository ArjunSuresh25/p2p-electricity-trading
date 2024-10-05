import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TradesService {
  constructor(private prisma: PrismaService) {}

  getTradesByID(userId: string, tradeId: string) {
    return this.prisma.trade.findFirstOrThrow({
      where: {
        AND: [
          { tradeId: tradeId },
          // { OR: [{ buyerId: userId }, { sellerId: userId }] },
        ],
      },
    });
  }

  getTradesByUserId(userId: string) {
    return this.prisma.trade.findMany({
      where: {
        OR: [
          { OR: [{ buyerId: userId }, { sellerId: userId }] },
          { status: 'PENDING' },
        ],
      },
    });
  }

  getAvailableTradesNotMatchingUser(userId: string) {
    return this.prisma.trade.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                AND: [
                  {
                    buyerId: {
                      not: null,
                    },
                  },
                  {
                    buyerId: {
                      not: userId,
                    },
                  },
                ],
              },
              {
                AND: [
                  {
                    sellerId: {
                      not: null,
                    },
                  },
                  {
                    sellerId: {
                      not: userId,
                    },
                  },
                ],
              },
            ],
          },
          {
            status: 'PENDING',
          },
        ],
      },
    });
  }

  createTrade(createTradeDto: Prisma.TradeCreateInput) {
    return this.prisma.trade.create({ data: createTradeDto });
  }

  cancelTrade(tradeId: string, userId: string) {
    return this.prisma.trade.updateMany({
      where: {
        AND: [
          { tradeId: tradeId },
          { OR: [{ buyerId: userId }, { sellerId: userId }] },
        ],
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  acceptBuy(tradeId: string, userId: string) {
    return this.prisma.trade.updateMany({
      where: {
        AND: [
          { tradeId },
          { sellerId: { not: userId } },
          { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        ],
      },
      data: {
        buyerId: userId,
        timeExecuted: new Date(),
        status: 'IN_PROGRESS',
      },
    });
  }

  acceptSell(tradeId: string, userId: string) {
    return this.prisma.trade.updateMany({
      where: {
        AND: [
          { tradeId },
          { buyerId: { not: userId } },
          { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        ],
      },
      data: {
        sellerId: userId,
        timeExecuted: new Date(),
        status: 'IN_PROGRESS',
      },
    });
  }

  completeTrade(tradeId: any, userId: any) {
    return this.prisma.trade.updateMany({
      where: {
        AND: [
          { tradeId: tradeId },
          { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        ],
      },
      data: {
        timeExecuted: new Date(),
        status: 'COMPLETED',
      },
    });
  }
}
