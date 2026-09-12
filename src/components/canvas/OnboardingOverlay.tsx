'use client';

import { useState, useSyncExternalStore } from 'react';
import { ArrowRight, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { IconChip } from '@/components/ui/panel';
import { NODE_REGISTRY } from '@/components/nodes/node-registry';
import { EDGE_REGISTRY } from '@/components/edges/edge-registry';
import { cn, edgeStroke, tint } from '@/lib/utils';
import type { SystemNodeType } from '@/types';

const STORAGE_KEY = 'sdc.onboarded';
const LEGACY_STORAGE_KEY = 'sdc-onboarding-seen';

const STEPS = [
  {
    title: 'Drag components onto the canvas',
    body: 'The library on the left has clients, compute, data, async and observability blocks. Drop one anywhere; snap keeps it tidy.',
  },
  {
    title: 'Connect them by their handles',
    body: 'Pull from any handle to another node. Pick the protocol — REST, gRPC, WebSocket, Pub/Sub — and the edge shows it.',
  },
  {
    title: 'Click to describe, then present',
    body: 'Selecting a node opens its editor: name, tech stack, description. When you are done, Present walks the diagram one node at a time.',
  },
];

const LIBRARY_TYPES: SystemNodeType[] = ['client', 'cdn', 'api-gateway', 'serverless', 'database'];

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}

function getOnboarded() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null || localStorage.getItem(LEGACY_STORAGE_KEY) !== null;
  } catch {
    return true;
  }
}

/** Server render (and hydration) treats onboarding as done; the client snapshot takes over after. */
function getServerOnboarded() {
  return true;
}

export function OnboardingOverlay() {
  const onboarded = useSyncExternalStore(subscribe, getOnboarded, getServerOnboarded);
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Storage unavailable — still hide for this session.
    }
    setDismissed(true);
  };

  const next = () => {
    if (step === STEPS.length - 1) finish();
    else setStep(step + 1);
  };

  const open = !onboarded && !dismissed;
  const copy = STEPS[step];
  const last = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && finish()}>
      <DialogContent
        className="max-w-[560px]"
        onInteractOutside={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') next();
          else if (e.key === 'ArrowLeft' && step > 0) setStep(step - 1);
        }}
      >
        <Illustration step={step} />

        <div className="grid gap-1.5 px-6 pt-[22px] pb-5">
          <div className="font-mono text-[11.5px] text-ink-3">
            {step + 1} of {STEPS.length}
          </div>
          <DialogTitle className="text-[20px] leading-[1.25] font-semibold tracking-[-0.015em]">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="mt-0 text-[14px] text-pretty text-ink-2">{copy.body}</DialogDescription>
        </div>

        <div className="flex items-center gap-2 px-6 pb-5">
          <div className="flex gap-[5px]" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-[width,background-color] duration-200',
                  i === step ? 'w-[18px] bg-accent' : i < step ? 'w-1.5 bg-ink-3' : 'w-1.5 bg-line'
                )}
              />
            ))}
          </div>
          <Button variant="ghost" size="toolbar" className="ml-auto" onClick={finish}>
            Skip
          </Button>
          <Button variant="primary" size="toolbar" className="px-4" onClick={next} autoFocus>
            {last ? 'Start building' : 'Next'}
            <ArrowRight />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Illustration ─────────────────────────────────────────── */

function MiniNode({
  type,
  label,
  subtitle,
  className,
  style,
}: {
  type: SystemNodeType;
  label: string;
  subtitle: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const config = NODE_REGISTRY[type];
  const Icon = config.icon;
  return (
    <div
      className={cn(
        'absolute flex w-[170px] items-center gap-2.5 rounded-[12px] border bg-paper px-3 py-[11px] transition-[left,top,transform,opacity,box-shadow,border-color] duration-300 ease-out',
        className
      )}
      style={style}
    >
      <IconChip color={config.color} size={28}>
        <Icon className="size-[15px]" />
      </IconChip>
      <div className="min-w-0">
        <div className="text-[13px] leading-4 font-semibold whitespace-nowrap">{label}</div>
        <div className="text-[11px] leading-[14px] whitespace-nowrap text-ink-3">{subtitle}</div>
      </div>
    </div>
  );
}

function Illustration({ step }: { step: number }) {
  const connected = step >= 1;
  const restColor = edgeStroke(EDGE_REGISTRY.rest.color);

  return (
    <div
      aria-hidden
      className="dot-grid relative h-[240px] shrink-0 overflow-hidden border-b border-line-2 [background-size:16px_16px]"
    >
      {/* Library panel (step 1) */}
      <div
        className={cn(
          'absolute top-4 bottom-4 left-4 grid w-[140px] content-start gap-0.5 rounded-[12px] border border-line bg-paper p-2 shadow-[var(--shadow-lg)] transition-[opacity,transform] duration-300',
          step === 0 ? 'opacity-100' : 'pointer-events-none -translate-x-3 opacity-0'
        )}
      >
        <div className="mb-1 h-6 rounded-[7px] bg-line-2" />
        {LIBRARY_TYPES.map((type) => {
          const config = NODE_REGISTRY[type];
          const Icon = config.icon;
          return (
            <div
              key={type}
              className={cn(
                'flex items-center gap-2 rounded-[7px] px-1.5 py-[5px] text-[12px] whitespace-nowrap',
                type === 'api-gateway' && 'bg-line-2'
              )}
            >
              <span
                className="inline-flex size-5 shrink-0 items-center justify-center rounded-[5px]"
                style={{ color: config.color, background: tint(config.color) }}
              >
                <Icon className="size-3" />
              </span>
              {config.label}
            </div>
          );
        })}
      </div>

      {/* Edge A → B */}
      <svg className="pointer-events-none absolute inset-0 overflow-visible" width="560" height="240">
        <path
          d="M 275 100 C 275 140, 445 110, 445 150"
          fill="none"
          stroke={restColor}
          strokeWidth={1.75}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          style={{
            strokeDashoffset: connected ? 0 : 1,
            opacity: connected ? 1 : 0,
            transition: 'stroke-dashoffset 500ms ease-out 150ms, opacity 150ms',
          }}
        />
      </svg>
      <div
        className={cn(
          'absolute top-[124px] left-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line bg-paper px-[9px] py-0.5 text-[10.5px] leading-[14px] font-medium text-ink-2 shadow-[var(--shadow)] transition-opacity duration-200',
          connected ? 'opacity-100 delay-500' : 'opacity-0'
        )}
      >
        REST
      </div>

      {/* Node A: dropped from the library, then settles */}
      <MiniNode
        type="api-gateway"
        label="API Gateway"
        subtitle="AWS API Gateway"
        className={cn(
          'border-line',
          step === 0
            ? 'animate-in fade-in-0 slide-in-from-top-4 zoom-in-95 top-[110px] left-[210px] rotate-[-2deg] shadow-[var(--shadow-lg)] duration-500'
            : 'top-10 left-[190px] shadow-[var(--shadow)]'
        )}
      />
      {step === 0 && (
        <MousePointer2
          className="animate-in fade-in-0 slide-in-from-top-4 absolute top-[146px] left-[362px] size-[18px] fill-ink text-paper duration-500"
          strokeWidth={1.5}
        />
      )}

      {/* Node B: appears when connecting, selected on step 3 */}
      <MiniNode
        type="serverless"
        label="API Lambda"
        subtitle="AWS Lambda"
        className={cn(
          'top-[150px] left-[360px]',
          connected ? 'opacity-100' : 'translate-y-2 opacity-0',
          step === 2
            ? 'border-accent shadow-[0_0_0_3px_var(--accent-soft),var(--shadow)]'
            : 'border-line shadow-[var(--shadow)]'
        )}
      />
      {step === 2 && (
        <MousePointer2
          className="animate-in fade-in-0 zoom-in-90 absolute top-[182px] left-[500px] size-[18px] fill-ink text-paper duration-300"
          strokeWidth={1.5}
        />
      )}
    </div>
  );
}
