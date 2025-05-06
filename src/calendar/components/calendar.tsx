import { eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import React from "preact";
import { env } from "../../env";

declare module 'preact' {
    namespace JSX {
        interface HTMLAttributes<RefType extends EventTarget = EventTarget> {
            tw?: string;
        }
    }
}

export type Event = {
    title: string
    description?: string
    startTime: string | null
    endTime: string | null
    accentColor?: string
    eventObjectId: string
}

interface EventCardProps {
    event: Event
}

function EventCard({ event }: EventCardProps) {
    const startTime = event.startTime ? toZonedTime(parseISO(event.startTime), env.TIMEZONE) : new Date();
    const endTime = event.endTime ? toZonedTime(parseISO(event.endTime), env.TIMEZONE) : new Date();
    const color = event.accentColor || '#ff7b00';

    const formatTime = (date: Date) => {
        return format(date, "h:mm a");
    };

    return (
        <div
            tw="flex flex-col p-2 rounded mb-1"
            style={{
                backgroundColor: `${color}15`,
                borderLeft: `4px solid ${color}`
            }}
        >
            <div tw="flex justify-between items-start pb-1">
                <div tw="font-bold text-sm">{event.title}</div>
                <div tw="flex flex-col text-xs text-neutral-800 ml-2 text-right">
                    <span>{formatTime(startTime)}</span>
                    <span>{formatTime(endTime)}</span>
                </div>
            </div>
            <span tw={`text-xs text-neutral-800 ${event.title.length > 21 ? '' : '-mt-3'}`}>{event.description}</span>
        </div>
    );
}

interface CalendarProps {
    events: Event[]
}

export function Calendar({ events }: CalendarProps) {
    const now = new Date();
    const currentMonth = toZonedTime(now, env.TIMEZONE);
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getEventsForDay = (day: Date) => {
        return events.filter((event) => {
            if (!event.startTime) return false;
            const eventDate = toZonedTime(parseISO(event.startTime), env.TIMEZONE);
            return isSameDay(eventDate, day);
        });
    };

    return (
        <div tw="flex flex-col h-full min-h-0">
            <div tw="flex justify-center items-center py-3 bg-red-500">
                <h2 tw="text-4xl font-bold text-white">{format(currentMonth, "MMMM yyyy")}</h2>
            </div>

            <div tw="flex bg-neutral-100 w-full  flex-row text-center">
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                    <div key={day} tw="flex-1 py-3 text-lg font-semibold border-b justify-center items-center border-neutral-200">
                        {day}
                    </div>
                ))}
            </div>

            <div tw="flex flex-col flex-1 min-h-0 bg-neutral-100">
                <div tw="flex flex-row flex-wrap h-full content-start">
                    {Array.from({ length: monthStart.getDay() }).map((_, index) => (
                        <div
                            key={`empty-start-${index}`}
                            tw="w-[14.28%] bg-white border border-neutral-200 "
                        />
                    ))}

                    {days.map((day) => {
                        const dayEvents = getEventsForDay(day);

                        return (
                            <div
                                key={day.toString()}
                                tw="flex flex-col w-[14.28%] h-1/5 bg-white border border-neutral-200 p-2 "
                                style={{
                                    opacity: !isSameMonth(day, currentMonth) ? 0.5 : 1
                                }}
                            >
                                <div tw="flex justify-between items-center mb-2">
                                    <span tw="flex items-center justify-center h-8 w-8 text-lg font-medium">
                                        {format(day, "d")}
                                    </span>
                                </div>
                                <div tw="flex flex-col flex-1">
                                    {dayEvents.map((event) => (
                                        <EventCard key={event.eventObjectId} event={event} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
                        <div
                            key={`empty-end-${index}`}
                            tw="w-[14.28%] bg-white border border-neutral-200 "
                        />
                    ))}
                </div>
            </div>
        </div>
    );
} 