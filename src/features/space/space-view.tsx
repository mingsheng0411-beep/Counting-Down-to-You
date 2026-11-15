"use client";

import { useState } from "react";

import { Brand } from "@/components/brand";
import { LanguageSwitch } from "@/components/language-switch";
import { Button, buttonClass } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { DistanceStats } from "@/features/distance/distance-stats";
import { MemoriesSection } from "@/features/memories/memories-section";
import { PlansSection } from "@/features/plans/plans-section";
import { SettingsForm } from "@/features/settings/settings-form";
import { useI18n } from "@/i18n/i18n-provider";

import { SpaceProvider, useSpace } from "./space-context";
import { SpaceStage } from "./space-stage";

function SpaceContent() {
  const { isDemo } = useSpace();
  const { dict, locale } = useI18n();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openSettings = () => setSettingsOpen(true);

  const demoNotice = isDemo ? (
    <div className="glass inline-flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-3xl py-1.5 pr-1.5 pl-4 md:rounded-full">
      <p className="py-1 text-xs font-semibold text-mute sm:text-sm">
        {dict.space.demoText}
      </p>
      <Button size="sm" onClick={openSettings} className="shrink-0">
        {dict.space.demoCta}
      </Button>
    </div>
  ) : null;

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-30 mx-auto max-w-[112rem] px-3 sm:px-6">
        <div className="glass flex items-center justify-between gap-3 rounded-full py-2 pr-2 pl-4">
          <Brand href={`/${locale}`} name={dict.brand} compact />
          <div className="flex items-center gap-2">
            <LanguageSwitch path="/space" />
            <button
              type="button"
              onClick={openSettings}
              className={buttonClass("primary", "sm") + " shrink-0 py-2 whitespace-nowrap"}
            >
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
                <circle cx="15" cy="7" r="2" />
                <circle cx="9" cy="17" r="2" />
              </svg>
              {dict.space.settings}
            </button>
          </div>
        </div>
      </header>

      <main>
        <SpaceStage onEdit={openSettings} notice={demoNotice} />
        <div className="mx-auto mt-4 max-w-7xl px-3 sm:px-6 md:mt-6">
          <DistanceStats />
        </div>
        <MemoriesSection onSetup={openSettings} />
        <PlansSection />
      </main>

      <footer className="px-5 py-10 text-center text-xs font-medium text-faint">
        {dict.landing.footer}
      </footer>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={dict.settings.title}
      >
        <SettingsForm onDone={() => setSettingsOpen(false)} />
      </Modal>
    </>
  );
}

function Loading() {
  const { dict } = useI18n();
  return (
    <div className="grid min-h-dvh place-items-center px-5 text-faint">
      <p className="animate-pulse text-xl font-bold">{dict.space.loading}</p>
    </div>
  );
}

/** The whole couple space: loads the data, then renders every section. */
export function SpaceView() {
  return (
    <SpaceProvider fallback={<Loading />}>
      <SpaceContent />
    </SpaceProvider>
  );
}
