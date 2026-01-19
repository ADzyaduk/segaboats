// Update group trip ticket status (Admin only)

import { prisma } from '~~/server/utils/db'
import { n8nEvents } from '~~/server/utils/n8n'

export default defineEventHandler(async (event) => {
  try {
    const tripId = getRouterParam(event, 'id')
    const ticketId = getRouterParam(event, 'ticketId')
    const body = await readBody<{ status: string }>()

    if (!tripId || !ticketId) {
      throw createError({
        statusCode: 400,
        message: 'ID поездки или билета не указан'
      })
    }

    const ticket = await prisma.groupTripTicket.findUnique({
      where: { id: ticketId },
      include: {
        trip: {
          select: {
            id: true,
            type: true,
            availableSeats: true
          }
        }
      }
    })

    if (!ticket) {
      throw createError({
        statusCode: 404,
        message: 'Билет не найден'
      })
    }

    if (ticket.tripId !== tripId) {
      throw createError({
        statusCode: 400,
        message: 'Билет не принадлежит этой поездке'
      })
    }

    const updateData: any = {}
    
    if (body.status) {
      updateData.status = body.status
      
      if (body.status === 'CONFIRMED' && ticket.status === 'PENDING') {
        updateData.confirmedAt = new Date()
        
        // Decrease available seats
        await prisma.groupTrip.update({
          where: { id: tripId },
          data: {
            availableSeats: {
              decrement: 1
            }
          }
        })
        
        // Check if trip is full
        const updatedTrip = await prisma.groupTrip.findUnique({
          where: { id: tripId },
          select: { availableSeats: true }
        })
        
        if (updatedTrip && updatedTrip.availableSeats <= 0) {
          await prisma.groupTrip.update({
            where: { id: tripId },
            data: { status: 'FULL' }
          })
        }
        
        // Trigger n8n webhook
        await n8nEvents.onGroupTripTicketConfirmed({
          ticketId: ticket.id,
          tripId: tripId,
          customerName: ticket.customerName,
          customerPhone: ticket.customerPhone,
          price: ticket.totalPrice
        })
      } else if (body.status === 'CANCELLED' && ticket.status !== 'CANCELLED') {
        updateData.cancelledAt = new Date()
        
        // Increase available seats if ticket was confirmed
        if (ticket.status === 'CONFIRMED') {
          await prisma.groupTrip.update({
            where: { id: tripId },
            data: {
              availableSeats: {
                increment: 1
              },
              status: 'SCHEDULED' // Change back to scheduled if was full
            }
          })
        }
        
        // Trigger n8n webhook
        await n8nEvents.onGroupTripTicketCancelled({
          ticketId: ticket.id,
          tripId: tripId,
          customerName: ticket.customerName,
          customerPhone: ticket.customerPhone
        })
      }
    }

    const updatedTicket = await prisma.groupTripTicket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        trip: {
          select: {
            type: true,
            departureDate: true
          }
        }
      }
    })

    return {
      success: true,
      data: updatedTicket
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }

    console.error('Error updating ticket:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка при обновлении билета'
    })
  }
})
