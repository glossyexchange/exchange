import { Prisma, PrismaClient } from '@prisma/client'
import { Request, Response } from 'express'
import { responseReturn } from '../utils/response'
import prisma from '../utils/prisma'
// const prisma = new PrismaClient()

interface DashboardData {
  // totalProduct: number
  totalOrder: number
  totalUser: number
  // totalCustomers: number
  requestUser: number
  messages: any[] // Replace with your message type
  recentOrders: any[] // Replace with your order type
  totalSale: number
}

interface MonthlySalesData {
  month: string
  totalSales: number
}

export interface GetSummaryParams {
  fromDate?: Date | null;
  toDate?: Date | null;
}

class DashboardtController {





  // getDashboardData = async (req: Request, res: Response): Promise<void> => {
  //   // const { id } = req.user // Assuming user is attached to request
  //   try {
  //     // Get all counts in parallel
  //     const [
  //       totalSaleResult,
  //       totalProduct,
  //       totalOrder,
  //       // totalCustomers,
  //       // requestUser,
  //     ] = await Promise.all([
  //       // Total sale aggregation
  //       prisma.customerOrder.aggregate({
  //         _sum: { totalAmount: true },
  //         where: { orderStatus: 'Pending' },
  //       }),

  //       // Product count
  //       // prisma.product.count(),

  //       // Order count
  //       prisma.customerOrder.count(),

  //       // User count
  //       prisma.accounts.count(),

  //       // Request users (inactive method)
  //       // prisma.user.count({
  //       //   where: {
  //       //     method: 'inactive',
  //       //   },
  //       // }),
  //     ])

  //     // Get recent data
  //     const [
  //       // messages,
  //       recentOrders,
  //     ] = await Promise.all([
  //       // prisma.message.findMany({
  //       //   take: 10,
  //       //   orderBy: {
  //       //     createdAt: 'desc',
  //       //   },
  //       // }),
  //       prisma.customerOrder.findMany({
  //         where: {
  //           orderStatus: 'Pending', // Add the status filter
  //         },
  //         take: 10,
  //         orderBy: {
  //           createdAt: 'desc',
  //         },
  //         include: {
  //           account: {
  //             select: {
  //               accountId: true,
  //               name: true,
  //               phone: true,
  //               address: true,
  //             },
  //           },
          
  //         },
  //       }),
  //     ])

  //     const responseData: DashboardData = {
  //       // totalProduct,
  //       totalOrder,
  //       // totalCustomers,
  //       // requestUser,
  //       // messages,
  //       recentOrders,
  //       totalSale: totalSaleResult._sum.totalAmount || 0,
  //       totalUser: 0,
  //       requestUser: 0,
  //       messages: [],
  //     }

  //     responseReturn(res, 200, responseData)
  //   } catch (error: any) {
  //     console.error('Dashboard error:', error)

  //     // Handle Prisma errors
  //     if (error instanceof Prisma.PrismaClientKnownRequestError) {
  //       return responseReturn(res, 500, {
  //         error: 'Database error',
  //         code: error.code,
  //         message: error.message,
  //       })
  //     }

  //     // Handle other errors
  //     return responseReturn(res, 500, {
  //       error: 'Internal server error',
  //       message: error.message || 'Failed to fetch dashboard data',
  //     })
  //   }
  // }

  getMonthlyChartData = async (req: Request, res: Response) => {
    try {
      const monthlySales = await prisma.$queryRaw<MonthlySalesData[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
          SUM("totalAmount") AS "totalSales"
        FROM "CustomerOrder"
        WHERE "orderStatus" = 'Pending'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `

      responseReturn(res, 200, {
        success: true,
        data: {
          chartData: monthlySales.map((sale) => ({
            month: new Date(sale.month).toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            }),
            totalSales: Number(sale.totalSales),
          })),
        },
      })
    } catch (error) {
      console.error('Chart data error:', error)
      responseReturn(res, 500, {
        success: false,
        error: 'Failed to fetch chart data',
      })
    }
  }
}

export default new DashboardtController()
