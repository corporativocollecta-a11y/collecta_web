'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Layout / sizing / interaction variants for the LiquidGlassButton.
 * Glass-specific values (gradients, layered shadows) are applied via inline
 * style below, because the multi-stop box-shadow is essential to the
 * "thick glass" appearance and shouldn't be overridable via className alone.
 */
const liquidGlassButtonVariants = cva(
  [
    'group relative inline-flex items-center justify-center',
    'font-medium tracking-wide whitespace-nowrap select-none',
    'rounded-2xl border border-white/[0.22] text-white',
    'transition-[transform,filter,box-shadow,background] duration-200 ease-out will-change-transform',
    'backdrop-blur-2xl backdrop-saturate-[1.8] backdrop-brightness-[1.05]',
    'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    '[text-shadow:0_1px_2px_rgba(0,0,0,0.4)]',
  ],
  {
    variants: {
      size: {
        sm: 'px-5 py-2.5 text-sm gap-2',
        md: 'px-7 py-3.5 text-base gap-2',
        lg: 'px-9 py-4 text-lg gap-2.5',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

type LiquidGlassTint = 'neutral' | 'green' | 'blue' | 'gold';

/** Background gradients per tint — the "glass color" you see through the surface. */
const TINT_BACKGROUNDS: Record<LiquidGlassTint, string> = {
  neutral:
    'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 60%, rgba(255,255,255,0.12) 100%)',
  green:
    'linear-gradient(180deg, rgba(140,220,160,0.32) 0%, rgba(60,140,90,0.14) 60%, rgba(40,110,70,0.20) 100%)',
  blue:
    'linear-gradient(180deg, rgba(140,180,255,0.32) 0%, rgba(50,90,170,0.14) 60%, rgba(30,60,140,0.20) 100%)',
  gold:
    'linear-gradient(180deg, rgba(255,220,150,0.30) 0%, rgba(180,140,70,0.14) 60%, rgba(150,110,50,0.20) 100%)',
};

/**
 * Layered shadows that give the button "thickness": top specular highlight,
 * bottom interior edge, a hairline outer shadow, and a soft depth shadow.
 */
const LIQUID_GLASS_SHADOW = [
  'inset 0 1px 0 0 rgba(255,255,255,0.45)',
  'inset 0 -1px 0 0 rgba(0,0,0,0.10)',
  '0 1px 2px 0 rgba(0,0,0,0.12)',
  '0 10px 28px -6px rgba(10,30,20,0.32)',
].join(', ');

/**
 * Lifted shadow used on hover — stronger highlight and a deeper drop shadow
 * to reinforce the floating-glass impression.
 */
const LIQUID_GLASS_SHADOW_HOVER = [
  'inset 0 1px 0 0 rgba(255,255,255,0.55)',
  'inset 0 -1px 0 0 rgba(0,0,0,0.12)',
  '0 2px 4px 0 rgba(0,0,0,0.15)',
  '0 16px 36px -8px rgba(10,30,20,0.42)',
].join(', ');

type LiquidGlassButtonProps = React.ComponentProps<'a'> &
  VariantProps<typeof liquidGlassButtonVariants> & {
    /** Color seen *through* the glass. @default "neutral" */
    tint?: LiquidGlassTint;
    /** Render a curved specular highlight on top. @default true */
    sheen?: boolean;
  };

/**
 * iOS-style Liquid Glass anchor button.
 *
 * Wraps a single `<a>` element and renders a translucent control with
 * backdrop blur, multi-layered specular shadows, and a soft top sheen.
 *
 * @example
 *   <LiquidGlassButton href="#clientes" tint="green">Clientes</LiquidGlassButton>
 */
export function LiquidGlassButton({
  className,
  size,
  tint = 'neutral',
  sheen = true,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: LiquidGlassButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <a
      data-slot="liquid-glass-button"
      data-tint={tint}
      data-state={hovered ? 'hover' : 'idle'}
      className={cn(liquidGlassButtonVariants({ size }), className)}
      style={{
        background: TINT_BACKGROUNDS[tint],
        boxShadow: hovered ? LIQUID_GLASS_SHADOW_HOVER : LIQUID_GLASS_SHADOW,
        ...style,
      }}
      onMouseEnter={(event) => {
        setHovered(true);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        setHovered(false);
        onMouseLeave?.(event);
      }}
      {...props}
    >
      {sheen ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
        >
          {/* Curved specular highlight on the top half. */}
          <span
            className="absolute inset-x-2 top-0 h-1/2 rounded-t-[inherit] opacity-90 mix-blend-screen"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.18) 35%, transparent 70%)',
            }}
          />
        </span>
      ) : null}

      <span className="relative z-10 inline-flex items-center gap-[inherit]">
        {children}
      </span>
    </a>
  );
}

export { liquidGlassButtonVariants };
export type { LiquidGlassButtonProps, LiquidGlassTint };
