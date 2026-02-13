import { useEffect, useRef, type ComponentProps } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { cn } from "@/lib/utils";

type CalendarProps = ComponentProps<typeof DayPicker> & {
  buttonVariant?: ComponentProps<typeof Button>["variant"];
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-paper group/calendar p-3 [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months,
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute top-0 inset-x-0 flex w-full items-center justify-between",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-sm" }),
          "size-8 p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant, size: "icon-sm" }),
          "size-8 p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-8",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root:
          "border-line-struct has-focus:ring-line-struct/50 has-focus:border-line-struct relative rounded-md border bg-paper shadow-xs has-focus:ring-[3px]",
        dropdown: cn(
          "bg-paper-lift absolute inset-0 opacity-0",
          defaultClassNames.dropdown,
        ),
        caption_label: cn(
          "text-sm font-medium select-none",
          captionLayout === "label"
            ? "text-sm"
            : "rounded-md pl-2 pr-1 flex h-8 items-center gap-1 text-sm [&>svg]:text-txt-muted [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        month_grid: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-txt-muted flex-1 rounded-md text-[0.8rem] font-normal select-none",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-8 text-center select-none",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-txt-muted text-[0.8rem] select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative aspect-square size-8 p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-md",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day,
        ),
        range_start: cn(
          "rounded-l-md bg-subtle",
          defaultClassNames.range_start,
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-subtle", defaultClassNames.range_end),
        today: cn(
          "bg-subtle text-txt-body rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-txt-muted aria-selected:text-txt-muted opacity-50",
          defaultClassNames.outside,
        ),
        disabled: cn("text-txt-muted opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div
            data-slot="calendar"
            ref={rootRef}
            className={cn(rootClassName)}
            {...rootProps}
          />
        ),
        Chevron: ({ className: iconClassName, orientation, ...iconProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeft
                className={cn("size-4", iconClassName)}
                {...iconProps}
              />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRight
                className={cn("size-4", iconClassName)}
                {...iconProps}
              />
            );
          }

          return (
            <ChevronDown
              className={cn("size-4", iconClassName)}
              {...iconProps}
            />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...weekNumberProps }) => (
          <td {...weekNumberProps}>
            <div className="flex size-8 items-center justify-center text-center">
              {children}
            </div>
          </td>
        ),
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-brand data-[selected-single=true]:text-txt-inverse data-[range-middle=true]:bg-subtle data-[range-middle=true]:text-txt-body data-[range-start=true]:bg-brand data-[range-start=true]:text-txt-inverse data-[range-end=true]:bg-brand data-[range-end=true]:text-txt-inverse group-data-[focused=true]/day:border-line-struct group-data-[focused=true]/day:ring-line-struct/50 hover:text-txt-body flex size-8 min-w-8 flex-col gap-1 rounded-md p-0 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-l-md [&>span]:text-[11px] [&>span]:opacity-70",
        defaultClassNames.day_button,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar };
export type { CalendarProps };
