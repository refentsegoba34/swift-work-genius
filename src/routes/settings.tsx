import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useActivity } from "@/lib/activity";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — WorkFlow AI" },
      {
        name: "description",
        content: "Set your display name, default email tone, working hours and activity logging preferences.",
      },
      { property: "og:title", content: "Settings — WorkFlow AI" },
      { property: "og:description", content: "Personalise WorkFlow AI to match how you work." },
    ],
  }),
  component: SettingsPage,
});

const STORAGE_KEY = "workflow-ai.settings";

type Settings = {
  name: string;
  role: string;
  workdayStart: string;
  workdayEnd: string;
  logActivity: boolean;
};

const DEFAULTS: Settings = {
  name: "",
  role: "",
  workdayStart: "09:00",
  workdayEnd: "17:00",
  logActivity: true,
};

function SettingsPage() {
  const { clearActivity } = useActivity();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) });
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("Settings saved");
  }

  return (
    <AppShell title="Settings" description="Personalise WorkFlow AI to match how you work.">
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <p className="label-eyebrow">Your profile</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                placeholder="Ayanda"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role">Job title</Label>
              <Input
                id="role"
                placeholder="Operations Coordinator"
                value={settings.role}
                onChange={(e) => setSettings({ ...settings, role: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start">Working day starts</Label>
                <Input
                  id="start"
                  type="time"
                  value={settings.workdayStart}
                  onChange={(e) => setSettings({ ...settings, workdayStart: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">Working day ends</Label>
                <Input
                  id="end"
                  type="time"
                  value={settings.workdayEnd}
                  onChange={(e) => setSettings({ ...settings, workdayEnd: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={save}>Save settings</Button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel p-5">
            <p className="label-eyebrow">Privacy & data</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="log">Keep an activity log</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Stored only in this browser. Nothing is shared with third parties.
                  </p>
                </div>
                <Switch
                  id="log"
                  checked={settings.logActivity}
                  onCheckedChange={(checked) => setSettings({ ...settings, logActivity: checked })}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  clearActivity();
                  toast.success("Activity log cleared");
                }}
              >
                Clear activity log
              </Button>
            </div>
          </section>

          <section className="panel p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="size-4 text-primary" aria-hidden />
              How WorkFlow AI uses AI
            </p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>AI requests run on the server — API credentials are never exposed to your browser.</li>
              <li>Outputs are generated only from the information you supply in each form.</li>
              <li>The AI is instructed never to invent people, decisions, owners or deadlines.</li>
              <li>Missing information is flagged rather than filled in with guesses.</li>
              <li>AI-generated content should be reviewed before use.</li>
            </ul>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
