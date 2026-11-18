"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";
import { cn } from "../lib/cn";

/** Curseur : piste bleue, poignée blanche cerclée (maquette Studio). */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
    {...props}
  >
    <SliderPrimitive.Track className="bg-border relative h-1.5 w-full grow overflow-hidden rounded-full">
      <SliderPrimitive.Range className="bg-action absolute h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="border-action focus-visible:ring-ring block size-5 rounded-full border-2 bg-white shadow-md focus-visible:outline-none focus-visible:ring-2" />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
