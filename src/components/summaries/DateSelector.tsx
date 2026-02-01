import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { pl } from "date-fns/locale";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  disabled: boolean;
}

export function DateSelector({ selectedDate, onDateChange, disabled }: DateSelectorProps) {
  const handlePreviousDay = () => {
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    onDateChange(previousDay);
  };

  const handleNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousDay}
          disabled={disabled}
          aria-label="Poprzedni dzień"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal" disabled={disabled}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDate(selectedDate)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              initialFocus
              locale={pl}
            />
          </PopoverContent>
        </Popover>

        <Button variant="outline" size="icon" onClick={handleNextDay} disabled={disabled} aria-label="Następny dzień">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
